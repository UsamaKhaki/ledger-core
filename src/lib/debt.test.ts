import { describe, it, expect } from "vitest";
import {
  buildPlan,
  totalMinimums,
  totalBalance,
  formatDuration,
} from "./debt";
import type { Debt } from "./types";

// Fixed start so month labels are deterministic (Jan 2026).
const START = new Date(2026, 0, 1);

function mkDebt(partial: Partial<Debt> & { id: string }): Debt {
  return {
    name: partial.id,
    balance: 1000,
    startingBalance: partial.balance ?? 1000,
    apr: 0,
    minPayment: 0,
    kind: "credit_card",
    ...partial,
  };
}

/**
 * Independent reference amortization for a SINGLE debt paid `payment`/month.
 * Mirrors the "accrue interest, then pay" order but is written from scratch so
 * it can act as an oracle for buildPlan.
 */
function refSingle(balance: number, aprPct: number, payment: number) {
  const r = aprPct / 100 / 12;
  let b = balance;
  let interest = 0;
  let paid = 0;
  let months = 0;
  while (b > 0.005 && months < 1200) {
    months += 1;
    const i = b * r;
    b += i;
    interest += i;
    const pay = Math.min(payment, b);
    b -= pay;
    paid += pay;
    if (b < 0) b = 0;
  }
  return { months, interest, paid, cleared: b <= 0.005 };
}

const near = (a: number, b: number, eps = 0.02) => Math.abs(a - b) <= eps;

describe("helpers", () => {
  it("totalMinimums sums, clamping negatives to 0", () => {
    expect(
      totalMinimums([
        mkDebt({ id: "a", minPayment: 50 }),
        mkDebt({ id: "b", minPayment: 25 }),
        mkDebt({ id: "c", minPayment: -10 }),
      ]),
    ).toBe(75);
  });

  it("totalBalance sums, clamping negatives to 0", () => {
    expect(
      totalBalance([
        mkDebt({ id: "a", balance: 100 }),
        mkDebt({ id: "b", balance: 250 }),
        mkDebt({ id: "c", balance: -5 }),
      ]),
    ).toBe(350);
  });

  it("formatDuration renders years and months", () => {
    expect(formatDuration(0)).toBe("0 mo");
    expect(formatDuration(-3)).toBe("0 mo");
    expect(formatDuration(5)).toBe("5 mo");
    expect(formatDuration(12)).toBe("1 yr");
    expect(formatDuration(28)).toBe("2 yr 4 mo");
  });
});

describe("buildPlan — edge cases", () => {
  it("no debts → feasible, zero months", () => {
    const plan = buildPlan([], 500, "avalanche", START);
    expect(plan.feasible).toBe(true);
    expect(plan.months).toBe(0);
    expect(plan.totalInterest).toBe(0);
    expect(plan.schedule).toHaveLength(0);
  });

  it("ignores debts with zero balance", () => {
    const plan = buildPlan(
      [
        mkDebt({ id: "paid", balance: 0, minPayment: 20 }),
        mkDebt({ id: "live", balance: 500, minPayment: 50 }),
      ],
      200,
      "avalanche",
      START,
    );
    expect(plan.perDebt.map((p) => p.debtId)).toEqual(["live"]);
    expect(plan.totalPrincipal).toBe(500);
  });

  it("budget below total minimums → infeasible with minRequired", () => {
    const debts = [
      mkDebt({ id: "a", balance: 3000, apr: 20, minPayment: 90 }),
      mkDebt({ id: "b", balance: 2000, apr: 15, minPayment: 60 }),
    ];
    const plan = buildPlan(debts, 100, "avalanche", START);
    expect(plan.feasible).toBe(false);
    expect(plan.minRequired).toBe(150);
    expect(plan.months).toBe(0);
    expect(plan.reason).toBeTruthy();
  });

  it("interest outpacing payments → infeasible (hits safety cap)", () => {
    // 300% APR ⇒ 25%/mo interest on 10k = 2500/mo, far above the 100 payment.
    const plan = buildPlan(
      [mkDebt({ id: "spiral", balance: 10000, apr: 300, minPayment: 100 })],
      100,
      "avalanche",
      START,
    );
    expect(plan.feasible).toBe(false);
    expect(plan.months).toBe(1200);
    expect(plan.reason).toMatch(/never fully clears|increasing your monthly/i);
  });
});

describe("buildPlan — single debt matches reference amortization", () => {
  it("0% APR is exact", () => {
    const plan = buildPlan(
      [mkDebt({ id: "a", balance: 1000, apr: 0, minPayment: 100 })],
      100,
      "avalanche",
      START,
    );
    expect(plan.months).toBe(10);
    expect(plan.totalInterest).toBe(0);
    expect(near(plan.totalPaid, 1000)).toBe(true);
    expect(plan.debtFreeLabel).toBe("Nov 2026"); // Jan 2026 + 10 months
  });

  it("with interest, matches an independent oracle", () => {
    const cases = [
      { balance: 1000, apr: 12, payment: 100 },
      { balance: 5200, apr: 22.9, payment: 300 },
      { balance: 8000, apr: 6.5, payment: 250 },
    ];
    for (const c of cases) {
      const ref = refSingle(c.balance, c.apr, c.payment);
      const plan = buildPlan(
        [mkDebt({ id: "a", balance: c.balance, apr: c.apr, minPayment: c.payment })],
        c.payment,
        "avalanche",
        START,
      );
      expect(plan.months).toBe(ref.months);
      expect(near(plan.totalInterest, ref.interest, 0.05)).toBe(true);
      expect(near(plan.totalPaid, ref.paid, 0.05)).toBe(true);
    }
  });
});

describe("buildPlan — invariants (multi-debt)", () => {
  const debts = [
    mkDebt({ id: "card", balance: 5000, apr: 24.99, minPayment: 120 }),
    mkDebt({ id: "loan", balance: 8000, apr: 9.5, minPayment: 180 }),
    mkDebt({ id: "store", balance: 1500, apr: 27.99, minPayment: 45 }),
  ];
  const budget = 700;

  for (const strategy of ["avalanche", "snowball"] as const) {
    describe(strategy, () => {
      const plan = buildPlan(debts, budget, strategy, START);

      it("is feasible and clears every debt", () => {
        expect(plan.feasible).toBe(true);
        const last = plan.schedule[plan.schedule.length - 1];
        expect(near(last.totalBalance, 0, 0.05)).toBe(true);
        expect(plan.perDebt).toHaveLength(3);
      });

      it("conserves money: totalPaid ≈ principal + interest", () => {
        expect(
          near(plan.totalPaid, plan.totalPrincipal + plan.totalInterest, 0.1),
        ).toBe(true);
      });

      it("schedule length equals months", () => {
        expect(plan.schedule).toHaveLength(plan.months);
      });

      it("monthly totals sum to the plan totals", () => {
        const paid = plan.schedule.reduce((s, m) => s + m.totalPaid, 0);
        const interest = plan.schedule.reduce((s, m) => s + m.totalInterest, 0);
        expect(near(paid, plan.totalPaid, 0.05)).toBe(true);
        expect(near(interest, plan.totalInterest, 0.05)).toBe(true);
      });

      it("never wastes budget: every month except the last pays the full budget", () => {
        plan.schedule.slice(0, -1).forEach((m) => {
          expect(near(m.totalPaid, budget, 0.02)).toBe(true);
        });
        const last = plan.schedule[plan.schedule.length - 1];
        expect(last.totalPaid).toBeLessThanOrEqual(budget + 0.02);
      });

      it("per-debt interest sums to total interest", () => {
        const sum = plan.perDebt.reduce((s, p) => s + p.interestPaid, 0);
        expect(near(sum, plan.totalInterest, 0.1)).toBe(true);
      });
    });
  }
});

describe("buildPlan — strategy targeting", () => {
  const debts = [
    mkDebt({ id: "big-highAPR", balance: 2000, apr: 30, minPayment: 50 }),
    mkDebt({ id: "small-lowAPR", balance: 1000, apr: 10, minPayment: 50 }),
  ];
  const budget = 300;

  const firstCleared = (strategy: "avalanche" | "snowball") => {
    const plan = buildPlan(debts, budget, strategy, START);
    return [...plan.perDebt].sort(
      (a, b) => a.monthsToPayoff - b.monthsToPayoff,
    )[0].debtId;
  };

  it("avalanche attacks the highest APR first", () => {
    expect(firstCleared("avalanche")).toBe("big-highAPR");
  });

  it("snowball attacks the smallest balance first", () => {
    expect(firstCleared("snowball")).toBe("small-lowAPR");
  });

  it("avalanche never pays more interest than snowball", () => {
    const av = buildPlan(debts, budget, "avalanche", START);
    const sn = buildPlan(debts, budget, "snowball", START);
    expect(av.totalInterest).toBeLessThanOrEqual(sn.totalInterest + 0.01);
  });
});

describe("buildPlan — tie-breaks", () => {
  it("avalanche: equal APR → smaller balance targeted first", () => {
    const plan = buildPlan(
      [
        mkDebt({ id: "bigger", balance: 3000, apr: 20, minPayment: 60 }),
        mkDebt({ id: "smaller", balance: 1500, apr: 20, minPayment: 60 }),
      ],
      400,
      "avalanche",
      START,
    );
    const first = [...plan.perDebt].sort(
      (a, b) => a.monthsToPayoff - b.monthsToPayoff,
    )[0].debtId;
    expect(first).toBe("smaller");
  });

  it("snowball: equal balance → higher APR targeted first", () => {
    const plan = buildPlan(
      [
        mkDebt({ id: "lowAPR", balance: 2000, apr: 8, minPayment: 60 }),
        mkDebt({ id: "highAPR", balance: 2000, apr: 26, minPayment: 60 }),
      ],
      400,
      "snowball",
      START,
    );
    const first = [...plan.perDebt].sort(
      (a, b) => a.monthsToPayoff - b.monthsToPayoff,
    )[0].debtId;
    expect(first).toBe("highAPR");
  });
});

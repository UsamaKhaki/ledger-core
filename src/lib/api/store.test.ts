import { beforeEach, describe, expect, it } from "vitest";
import type { DebtInput } from "@/lib/types";
import { store } from "./store";

const card: DebtInput = {
  name: "Visa",
  kind: "credit_card",
  balance: 1000,
  apr: 24,
  minPayment: 50,
};

describe("mock store", () => {
  beforeEach(() => store.clear());

  it("starts a new debt with startingBalance equal to its balance", () => {
    const debt = store.createDebt(card);
    expect(debt.startingBalance).toBe(1000);
    expect(debt.issuer).toBeNull();
    expect(store.listDebts()).toHaveLength(1);
  });

  it("returns copies, so callers cannot mutate stored state", () => {
    const debt = store.createDebt(card);
    debt.balance = 0;
    expect(store.listDebts()[0].balance).toBe(1000);
  });

  it("raises startingBalance when a balance is corrected upward", () => {
    const debt = store.createDebt(card);
    const updated = store.updateDebt(debt.id, { balance: 1500 });
    expect(updated?.startingBalance).toBe(1500);

    const lowered = store.updateDebt(debt.id, { balance: 800 });
    expect(lowered?.startingBalance).toBe(1500);
  });

  it("returns null when updating or paying an unknown debt", () => {
    expect(store.updateDebt("missing", { name: "x" })).toBeNull();
    expect(store.logPayment("missing", 10)).toBeNull();
  });

  it("reduces the balance and records the payment", () => {
    const debt = store.createDebt(card);
    const result = store.logPayment(debt.id, 200);
    expect(result?.debt.balance).toBe(800);
    expect(result?.cleared).toBe(false);
    expect(store.listPayments()).toHaveLength(1);
  });

  it("never takes a balance below zero and flags the payment that clears it", () => {
    const debt = store.createDebt(card);
    const result = store.logPayment(debt.id, 5000);
    expect(result?.debt.balance).toBe(0);
    expect(result?.cleared).toBe(true);
    expect(result?.payment.clearedDebt).toBe(true);
  });

  it("does not flag a second payment on an already cleared debt", () => {
    const debt = store.createDebt(card);
    store.logPayment(debt.id, 1000);
    expect(store.logPayment(debt.id, 10)?.cleared).toBe(false);
  });

  it("deletes a debt's payments along with the debt", () => {
    const keep = store.createDebt({ ...card, name: "Keep" });
    const drop = store.createDebt({ ...card, name: "Drop" });
    store.logPayment(keep.id, 10);
    store.logPayment(drop.id, 10);

    expect(store.removeDebt(drop.id)).toBe(true);
    expect(store.removeDebt(drop.id)).toBe(false);
    expect(store.listDebts().map((d) => d.name)).toEqual(["Keep"]);
    expect(store.listPayments().every((p) => p.debtId === keep.id)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { validateDebtInput, validatePayment } from "./validate";

// The contract uses `c.type<T>()` — compile-time only. Anything can be POSTed,
// so these guards are the only thing standing between a hostile body and the
// database. Bad input must be rejected, not coerced.

const ok = {
  name: "Sapphire Visa",
  kind: "credit_card",
  balance: 5200,
  apr: 22.9,
  minPayment: 130,
};

describe("validateDebtInput — create", () => {
  it("accepts a well-formed debt and trims the name", () => {
    const r = validateDebtInput({ ...ok, name: "  Sapphire Visa  " }, {
      partial: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe("Sapphire Visa");
      expect(r.value.balance).toBe(5200);
    }
  });

  it.each([
    ["a non-object body", "not an object"],
    ["a missing name", { ...ok, name: "" }],
    ["a whitespace-only name", { ...ok, name: "   " }],
    ["a name over the length cap", { ...ok, name: "a".repeat(121) }],
    ["a zero balance", { ...ok, balance: 0 }],
    ["a negative balance", { ...ok, balance: -1 }],
    ["a non-numeric balance", { ...ok, balance: "abc" }],
    ["an absurd balance", { ...ok, balance: 1e12 }],
    ["a negative APR", { ...ok, apr: -5 }],
    ["an absurd APR", { ...ok, apr: 99999 }],
    ["an unknown kind", { ...ok, kind: "<script>alert(1)</script>" }],
    ["a negative minimum payment", { ...ok, minPayment: -10 }],
    ["a due day of 0", { ...ok, dueDay: 0 }],
    ["a due day of 32", { ...ok, dueDay: 32 }],
    ["a fractional due day", { ...ok, dueDay: 3.5 }],
  ])("rejects %s", (_label, body) => {
    expect(validateDebtInput(body, { partial: false }).ok).toBe(false);
  });

  it("rejects NaN and Infinity balances", () => {
    expect(validateDebtInput({ ...ok, balance: NaN }, { partial: false }).ok).toBe(
      false,
    );
    expect(
      validateDebtInput({ ...ok, balance: Infinity }, { partial: false }).ok,
    ).toBe(false);
  });

  it("normalises a zero or negative credit limit to null", () => {
    const r = validateDebtInput({ ...ok, creditLimit: 0 }, { partial: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.creditLimit).toBeNull();
  });
});

describe("validateDebtInput — patch", () => {
  it("accepts a single field and leaves the rest untouched", () => {
    const r = validateDebtInput({ apr: 4.25 }, { partial: true });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({ apr: 4.25 });
      expect("name" in r.value).toBe(false);
    }
  });

  it("accepts an empty patch", () => {
    expect(validateDebtInput({}, { partial: true }).ok).toBe(true);
  });

  it("still validates the fields that are present", () => {
    expect(validateDebtInput({ apr: -1 }, { partial: true }).ok).toBe(false);
    expect(validateDebtInput({ name: "" }, { partial: true }).ok).toBe(false);
    expect(validateDebtInput({ kind: "nope" }, { partial: true }).ok).toBe(false);
  });

  it("allows a balance of 0 on patch — a debt can be paid off", () => {
    const r = validateDebtInput({ balance: 0 }, { partial: true });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.balance).toBe(0);
  });

  it("allows clearing optional fields with null", () => {
    const r = validateDebtInput(
      { issuer: null, creditLimit: null, dueDay: null },
      { partial: true },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.issuer).toBeNull();
      expect(r.value.creditLimit).toBeNull();
      expect(r.value.dueDay).toBeNull();
    }
  });
});

describe("validatePayment", () => {
  it("accepts a positive amount against a debt", () => {
    const r = validatePayment({ debtId: "dbt_1", amount: 130 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ debtId: "dbt_1", amount: 130 });
  });

  it.each([
    ["a zero amount", { debtId: "dbt_1", amount: 0 }],
    ["a negative amount", { debtId: "dbt_1", amount: -50 }],
    ["a NaN amount", { debtId: "dbt_1", amount: NaN }],
    ["an absurd amount", { debtId: "dbt_1", amount: 1e12 }],
    ["a missing debt id", { amount: 50 }],
    ["a blank debt id", { debtId: "   ", amount: 50 }],
    ["a non-object body", null],
  ])("rejects %s", (_label, body) => {
    expect(validatePayment(body).ok).toBe(false);
  });
});

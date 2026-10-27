import { describe, expect, it } from "vitest";
import { isEntitledStatus, isProProfile, remindersAllowed } from "./tiers";

describe("isEntitledStatus", () => {
  it("keeps Pro on for active and trialing subscriptions", () => {
    expect(isEntitledStatus("active")).toBe(true);
    expect(isEntitledStatus("trialing")).toBe(true);
  });

  it("drops to free for every other status", () => {
    for (const s of ["past_due", "canceled", "unpaid", "incomplete", "", null, undefined]) {
      expect(isEntitledStatus(s)).toBe(false);
    }
  });
});

describe("isProProfile", () => {
  it("needs both the pro plan and an entitled status", () => {
    expect(isProProfile({ plan: "pro", subscription_status: "active" })).toBe(true);
    expect(isProProfile({ plan: "pro", subscription_status: "canceled" })).toBe(false);
    expect(isProProfile({ plan: "free", subscription_status: "active" })).toBe(false);
  });

  it("treats a missing profile as free", () => {
    expect(isProProfile(null)).toBe(false);
    expect(isProProfile(undefined)).toBe(false);
  });
});

describe("remindersAllowed", () => {
  const free = { plan: "free", subscription_status: null };
  const pro = { plan: "pro", subscription_status: "active" };
  const lapsed = { plan: "pro", subscription_status: "past_due" };

  it("only emails Pro subscribers when Stripe is configured", () => {
    expect(remindersAllowed(pro, true)).toBe(true);
    expect(remindersAllowed(free, true)).toBe(false);
    expect(remindersAllowed(lapsed, true)).toBe(false);
  });

  it("does not gate on plan in local-simulation billing mode", () => {
    expect(remindersAllowed(free, false)).toBe(true);
    expect(remindersAllowed(lapsed, false)).toBe(true);
  });
});

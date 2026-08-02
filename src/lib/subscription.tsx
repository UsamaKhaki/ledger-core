"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { LIMITS, type Limits, type Plan } from "./tiers";
import { useLocalStorage } from "./useLocalStorage";
import { track } from "./analytics";

type SubscriptionRecord = {
  plan: Plan;
  billing?: "monthly" | "yearly";
  since?: string; // ISO date the plan started
};

type SubscriptionContextValue = {
  plan: Plan;
  isPro: boolean;
  limits: Limits;
  billing?: "monthly" | "yearly";
  /**
   * Simulated upgrade. In production this is the success handler after a real
   * Stripe Checkout session completes (or a webhook flips the flag server-side).
   */
  upgrade: (billing: "monthly" | "yearly") => void;
  downgrade: () => void;
  hydrated: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const DEFAULT: SubscriptionRecord = { plan: "free" };

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const {
    value: sub,
    setValue: setSub,
    hydrated,
  } = useLocalStorage<SubscriptionRecord>("debtplanner.subscription", DEFAULT);

  const value = useMemo<SubscriptionContextValue>(() => {
    const plan = sub.plan;
    return {
      plan,
      isPro: plan === "pro",
      limits: LIMITS[plan],
      billing: sub.billing,
      upgrade: (billing) => {
        // --- Stripe wiring point -------------------------------------------
        // Production flow: POST /api/checkout -> redirect to Stripe Checkout,
        // then on return / webhook set plan to "pro". For the scaffold we flip
        // the local flag directly so the full Pro experience is testable.
        setSub({
          plan: "pro",
          billing,
          since: new Date().toISOString(),
        });
        track("upgraded", { billing });
      },
      downgrade: () => {
        setSub({ plan: "free" });
        track("downgraded");
      },
      hydrated,
    };
  }, [sub, setSub, hydrated]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}

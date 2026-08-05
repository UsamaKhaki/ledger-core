"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LIMITS, type Limits, type Plan } from "./tiers";
import { useLocalStorage } from "./useLocalStorage";
import { useAuth } from "./auth/useAuth";
import { api } from "./api/client";
import { track } from "./analytics";

type Billing = "monthly" | "yearly";

type SubscriptionContextValue = {
  plan: Plan;
  isPro: boolean;
  limits: Limits;
  billing?: Billing | null;
  status?: string | null;
  /** True once Stripe is wired up; false means local-simulation mode (dev). */
  configured: boolean;
  hydrated: boolean;
  /** Start Checkout (redirects to Stripe) — or flip the local flag in dev. */
  upgrade: (billing: Billing) => Promise<void>;
  /** Open the Billing Portal (redirects to Stripe) — or cancel locally in dev. */
  manage: () => Promise<void>;
  /** Re-read server subscription state. */
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

type LocalSub = { plan: Plan; billing?: Billing };
const LOCAL_DEFAULT: LocalSub = { plan: "free" };

type ServerState = {
  configured: boolean;
  plan: Plan;
  billing?: Billing | null;
  status?: string | null;
};
const SERVER_DEFAULT: ServerState = {
  configured: false,
  plan: "free",
  billing: null,
  status: null,
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  // Local simulation state — only used when Stripe isn't configured.
  const {
    value: local,
    setValue: setLocal,
    hydrated: localHydrated,
  } = useLocalStorage<LocalSub>("debtplanner.subscription", LOCAL_DEFAULT);

  const [server, setServer] = useState<ServerState>(SERVER_DEFAULT);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await api.billing.status();
      if (res.status === 200) {
        setServer({
          configured: res.body.configured,
          plan: res.body.plan,
          billing: res.body.billing ?? null,
          status: res.body.status ?? null,
        });
      }
    } catch {
      // network error — keep whatever we had; stay in free.
    } finally {
      setLoaded(true);
    }
  }, []);

  // Fetch server state on mount and whenever the signed-in user changes.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      await refresh();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, refresh]);

  const value = useMemo<SubscriptionContextValue>(() => {
    const configured = server.configured;
    const plan: Plan = configured ? server.plan : local.plan;
    const billing = configured ? server.billing : local.billing;

    return {
      plan,
      isPro: plan === "pro",
      limits: LIMITS[plan],
      billing,
      status: server.status,
      configured,
      hydrated: configured ? loaded : localHydrated,

      upgrade: async (b: Billing) => {
        track("checkout_started", { billing: b });
        if (!configured) {
          setLocal({ plan: "pro", billing: b });
          track("upgraded", { billing: b, simulated: true });
          return;
        }
        const res = await api.billing.checkout({ body: { billing: b } });
        if (res.status === 200) {
          window.location.href = res.body.url;
        }
      },

      manage: async () => {
        if (!configured) {
          setLocal({ plan: "free" });
          track("downgraded", { simulated: true });
          return;
        }
        const res = await api.billing.portal();
        if (res.status === 200) {
          window.location.href = res.body.url;
        }
      },

      refresh,
    };
  }, [server, local, loaded, localHydrated, setLocal, refresh]);

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

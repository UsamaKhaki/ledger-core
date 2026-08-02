"use client";

import type { ReactNode } from "react";
import { MoneyProvider } from "@/lib/CurrencyContext";
import { SubscriptionProvider } from "@/lib/subscription";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MoneyProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </MoneyProvider>
  );
}

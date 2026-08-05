"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";
import { MoneyProvider } from "@/lib/CurrencyContext";
import { SubscriptionProvider } from "@/lib/subscription";
import { AuthProvider } from "@/lib/auth/useAuth";
import { CookieConsent } from "@/components/CookieConsent";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MoneyProvider>
          <SubscriptionProvider>
            {children}
            <CookieConsent />
          </SubscriptionProvider>
        </MoneyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

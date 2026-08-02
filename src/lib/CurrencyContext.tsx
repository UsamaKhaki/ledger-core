"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  CURRENCIES,
  DEFAULT_SETTINGS,
  getCurrency,
  type Currency,
  type CurrencyCode,
  type Settings,
} from "./settings";
import { useLocalStorage } from "./useLocalStorage";

type MoneyContextValue = {
  settings: Settings;
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;
  /** Whole-unit formatting, e.g. "$1,240". */
  format: (n: number) => string;
  /** Two-decimal formatting, e.g. "$1,240.50". */
  formatCents: (n: number) => string;
  hydrated: boolean;
};

const MoneyContext = createContext<MoneyContextValue | null>(null);

export function MoneyProvider({ children }: { children: ReactNode }) {
  const {
    value: settings,
    setValue: setSettings,
    hydrated,
  } = useLocalStorage<Settings>("debtplanner.settings", DEFAULT_SETTINGS);

  const value = useMemo<MoneyContextValue>(() => {
    const currency = getCurrency(settings.currency);
    // JPY etc. conventionally have no minor unit.
    const zeroDecimal = currency.code === "JPY";

    const whole = new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0,
    });
    const cents = new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: zeroDecimal ? 0 : 2,
      maximumFractionDigits: zeroDecimal ? 0 : 2,
    });

    return {
      settings,
      currency,
      setCurrency: (code: CurrencyCode) =>
        setSettings((prev) => ({ ...prev, currency: code })),
      format: (n: number) => whole.format(Number.isFinite(n) ? n : 0),
      formatCents: (n: number) => cents.format(Number.isFinite(n) ? n : 0),
      hydrated,
    };
  }, [settings, setSettings, hydrated]);

  return (
    <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>
  );
}

export function useMoney(): MoneyContextValue {
  const ctx = useContext(MoneyContext);
  if (!ctx) {
    throw new Error("useMoney must be used within a MoneyProvider");
  }
  return ctx;
}

export { CURRENCIES };

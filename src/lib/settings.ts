export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "INR"
  | "PKR"
  | "CAD"
  | "AUD"
  | "AED"
  | "SAR"
  | "SGD"
  | "ZAR"
  | "BRL"
  | "NGN";

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string; // used for Intl.NumberFormat grouping/decimals
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", locale: "en-PK" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "en-AE" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", locale: "en-SA" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export type Settings = {
  currency: CurrencyCode;
};

export const DEFAULT_SETTINGS: Settings = {
  currency: DEFAULT_CURRENCY,
};

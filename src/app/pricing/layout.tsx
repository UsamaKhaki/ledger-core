import type { Metadata } from "next";
import type { ReactNode } from "react";

// `pricing/page.tsx` is a Client Component (it drives Checkout), and Client
// Components can't export `metadata` — so the page's SEO lives here.
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Ledger is free to start — track up to 3 debts, compare avalanche vs snowball, and see your debt-free date. Pro adds unlimited debts, the full amortization schedule, and CSV export.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing · Ledger",
    description:
      "Free to start. Pro adds unlimited debts, the full schedule, and CSV export.",
    url: "/pricing",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

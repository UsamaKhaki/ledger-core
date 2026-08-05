import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// One precise sans for everything (Linear-style); mono for figures.
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "Turn your debts into one clear plan. See your debt-free date, compare avalanche vs snowball, and track every payment. Private and free to start.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ledger — Get out of debt, simply and smartly",
    template: "%s · Ledger",
  },
  description: DESCRIPTION,
  applicationName: "Ledger",
  keywords: [
    "debt payoff",
    "debt snowball",
    "debt avalanche",
    "credit card payoff",
    "debt planner",
    "get out of debt",
    "payoff calculator",
    "debt tracker",
  ],
  authors: [{ name: "Ledger" }],
  creator: "Ledger",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Ledger",
    url: SITE_URL,
    title: "Ledger — Get out of debt, simply and smartly",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ledger — Get out of debt, simply and smartly",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}

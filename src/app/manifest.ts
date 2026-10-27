import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ledger Debt Planner",
    short_name: "Ledger",
    description:
      "Turn your debts into one clear plan. See your debt-free date and track every payment.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

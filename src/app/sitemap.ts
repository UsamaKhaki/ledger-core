import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  // Public, indexable routes only.
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/pricing", priority: 0.8 },
    { path: "/how-it-works", priority: 0.7 },
    { path: "/avalanche-vs-snowball", priority: 0.7 },
    { path: "/faq", priority: 0.6 },
    { path: "/signup", priority: 0.6 },
    { path: "/login", priority: 0.4 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: "weekly",
    priority: r.priority,
  }));
}

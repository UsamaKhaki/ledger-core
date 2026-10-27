import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// The planner holds personal financial data — keep it out of every index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Never prerender an auth-gated route: the answer depends entirely on the
// request's session cookie, so a build-time render is meaningless (and, with a
// provider that refuses to run unconfigured, a build failure).
export const dynamic = "force-dynamic";

// Authoritative server-side gate for the planner. Runs on the server before any
// protected UI is sent, so there's no client-side flash of the app for signed-
// out visitors. The proxy also refreshes the session + redirects at the edge;
// this is the belt-and-suspenders check closest to the pages. Actual data
// access is independently protected by row-level security at the API layer.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await auth.getUser();
  if (!user) redirect("/login?next=/app");
  return <>{children}</>;
}

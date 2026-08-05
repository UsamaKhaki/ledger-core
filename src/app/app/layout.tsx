import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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

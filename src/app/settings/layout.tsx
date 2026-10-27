import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Client Component page → metadata lives here. Never index a personal
// settings screen: robots.txt asks crawlers not to fetch it, this tells any
// crawler that reaches it anyway (e.g. via a shared link) not to index it.
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

// Never prerender an auth-gated route — the answer depends entirely on the
// request's session cookie.
export const dynamic = "force-dynamic";

// Authoritative server-side gate, mirroring `/app`. Settings exposes the
// account (email, password change, plan, data export, account deletion), so it
// must not render for signed-out visitors. The proxy also redirects at the
// edge; this is the check closest to the page.
export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await auth.getUser();
  if (!user) redirect("/login?next=/settings");
  return <>{children}</>;
}

// Email-confirmation callback. Supabase sends the user here from the
// confirmation link; we exchange the token for a session (which sets the auth
// cookies) and redirect into the app.
//
// Supports both auth flows:
//   • token_hash + type  → verifyOtp   (recommended; set via the email template)
//   • code               → exchangeCodeForSession (PKCE default)
//
// Email template (Auth → Email Templates → Confirm signup) should point to:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/app

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

// Only allow same-origin relative paths, so this can't be used as an open redirect.
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/app";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const sb = await supabaseServer();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) console.error("[auth/confirm] verifyOtp failed:", error.message);
    ok = !error;
  } else if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error)
      console.error("[auth/confirm] code exchange failed:", error.message);
    ok = !error;
  } else {
    console.warn("[auth/confirm] missing token_hash/type and code");
  }

  // redirect() throws NEXT_REDIRECT (must stay outside any try/catch); Next
  // flushes the session cookies set above onto the redirect response.
  redirect(ok ? next : "/login?confirm=failed");
}

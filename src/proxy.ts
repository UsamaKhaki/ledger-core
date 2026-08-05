// Next 16 "Proxy" (formerly Middleware). Protected-route handling for the
// authenticated surface:
//   1. Keep the Supabase session fresh (refresh auth cookies each request).
//   2. Redirect signed-OUT visitors away from /app → /login (before render).
//   3. Redirect signed-IN visitors away from the auth pages → /app.
// The /app server layout + RLS remain the authoritative checks.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { rateLimit } from "@/lib/rateLimit";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

// Per-endpoint limits for sensitive auth POSTs (keyed by client IP).
const AUTH_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth/login": { limit: 8, windowMs: 5 * 60_000 }, // brute-force
  "/api/auth/signup": { limit: 5, windowMs: 60 * 60_000 }, // spam accounts
  "/api/auth/reset-request": { limit: 4, windowMs: 60 * 60_000 },
  "/api/auth/resend": { limit: 4, windowMs: 60 * 60_000 },
  "/api/auth/update-password": { limit: 6, windowMs: 15 * 60_000 },
};

function clientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

async function enforceRateLimit(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse | null> {
  const cfg = AUTH_LIMITS[pathname];
  if (!cfg) return null;
  const { success, retryAfter } = await rateLimit(
    `rl:${pathname}:${clientIp(request)}`,
    cfg.limit,
    cfg.windowMs,
  );
  if (success) return null;
  return new NextResponse(
    JSON.stringify({
      error: "Too many attempts. Please wait a bit and try again.",
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
      },
    },
  );
}

function isAppRoute(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}
function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.includes(pathname);
}

function redirectTo(request: NextRequest, pathname: string, withNext = false) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (withNext) url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Rate-limit sensitive auth endpoints before anything else.
  if (request.method === "POST") {
    const limited = await enforceRateLimit(request, pathname);
    if (limited) return limited;
  }
  // API routes don't need page gating or session refresh here.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mock/dev mode (no Supabase): optimistic cookie-presence checks only.
  if (!supaUrl || !supaKey) {
    const signedIn = !!request.cookies.get("ledger_session");
    if (isAppRoute(pathname) && !signedIn) return redirectTo(request, "/login", true);
    if (isAuthPage(pathname) && signedIn) return redirectTo(request, "/app");
    return NextResponse.next();
  }

  // Supabase mode: refresh session cookies, then gate.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supaUrl, supaKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isAppRoute(pathname)) return redirectTo(request, "/login", true);
  if (user && isAuthPage(pathname)) return redirectTo(request, "/app");

  return response;
}

export const config = {
  matcher: [
    "/app/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/api/auth/:path*",
  ],
};

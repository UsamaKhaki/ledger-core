import { mockAuthProvider } from "./mock-provider";
import { supabaseAuthProvider } from "./supabase-provider";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { AuthProvider, AuthResult, Credentials, AuthUser } from "./types";

/**
 * The mock provider keeps accounts in process memory: they vanish on every
 * restart and aren't shared between server instances, so in production it would
 * sign people out at random and lose every account. Refuse to serve requests on
 * it unless someone explicitly opts in (a throwaway demo deploy) — matching
 * `ALLOW_MOCK_DATA` in `lib/api/data.ts`.
 *
 * Checked per request, never at module load: Next imports route modules while
 * collecting page data during `next build`, so throwing at import time would
 * break every build that doesn't happen to have the env vars set.
 */
function assertProviderAllowed(): void {
  if (isSupabaseConfigured()) return;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_MOCK_DATA !== "true"
  ) {
    throw new Error(
      "Refusing to serve requests with the in-memory mock auth provider in " +
        "production. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY, or set ALLOW_MOCK_DATA=true for a " +
        "throwaway demo deploy.",
    );
  }
}

// Use Supabase when env vars are present; fall back to the in-memory mock
// (keeps local/dev working without a Supabase project). Resolved per call so a
// build without env vars still succeeds.
const provider = (): AuthProvider =>
  isSupabaseConfigured() ? supabaseAuthProvider : mockAuthProvider;

export const auth: AuthProvider = {
  signUp(creds: Credentials): Promise<AuthResult> {
    assertProviderAllowed();
    return provider().signUp(creds);
  },
  signIn(creds: Credentials): Promise<AuthResult> {
    assertProviderAllowed();
    return provider().signIn(creds);
  },
  signOut(): Promise<void> {
    assertProviderAllowed();
    return provider().signOut();
  },
  getUser(): Promise<AuthUser | null> {
    assertProviderAllowed();
    return provider().getUser();
  },
  resendConfirmation(email: string): Promise<void> {
    assertProviderAllowed();
    return provider().resendConfirmation?.(email) ?? Promise.resolve();
  },
  requestPasswordReset(email: string): Promise<void> {
    assertProviderAllowed();
    return provider().requestPasswordReset?.(email) ?? Promise.resolve();
  },
  updatePassword(password: string): Promise<{ error: string | null }> {
    assertProviderAllowed();
    return (
      provider().updatePassword?.(password) ??
      Promise.resolve({ error: "Password updates aren't supported here." })
    );
  },
};

export type { AuthUser, AuthResult, Credentials, AuthProvider } from "./types";

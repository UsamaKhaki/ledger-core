import type { User } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import type { AuthProvider, AuthResult, AuthUser, Credentials } from "./types";

function toUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email ?? "",
    name: (u.user_metadata?.name as string | undefined) ?? null,
    createdAt: u.created_at,
  };
}

// Where Supabase should send users after they click an email link. Must also
// be listed under Auth → URL Configuration → Redirect URLs.
function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
function confirmRedirect(next = "/app"): string {
  return `${siteBase()}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export const supabaseAuthProvider: AuthProvider = {
  async signUp({ email, password, name }: Credentials): Promise<AuthResult> {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: name ? { name } : undefined,
        emailRedirectTo: confirmRedirect(),
      },
    });
    if (error) return { user: null, error: error.message };
    // No session means email confirmation is required — the user isn't logged
    // in yet. Signal the caller to show a "check your email" screen.
    if (!data.session || !data.user) {
      return { user: null, error: null, pendingConfirmation: true };
    }
    return { user: toUser(data.user), error: null };
  },

  async resendConfirmation(email: string): Promise<void> {
    const sb = await supabaseServer();
    await sb.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: confirmRedirect() },
    });
  },

  async requestPasswordReset(email: string): Promise<void> {
    const sb = await supabaseServer();
    // Recovery link → /auth/confirm (verifyOtp starts a session) → then the
    // user lands on the "set a new password" screen.
    await sb.auth.resetPasswordForEmail(email, {
      redirectTo: confirmRedirect("/auth/update-password"),
    });
  },

  async updatePassword(password: string): Promise<{ error: string | null }> {
    const sb = await supabaseServer();
    const { error } = await sb.auth.updateUser({ password });
    return { error: error?.message ?? null };
  },

  async signIn({ email, password }: Credentials): Promise<AuthResult> {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return { user: null, error: error?.message ?? "Sign in failed." };
    }
    return { user: toUser(data.user), error: null };
  },

  async signOut(): Promise<void> {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  },

  async getUser(): Promise<AuthUser | null> {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    return data.user ? toUser(data.user) : null;
  },
};

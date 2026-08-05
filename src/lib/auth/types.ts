// Shared auth types. The AuthProvider interface is deliberately shaped to match
// Supabase Auth (email/password + cookie session) so we can swap the mock
// implementation for a real Supabase-backed one without touching callers.

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export type AuthResult = {
  user: AuthUser | null;
  error: string | null;
  /** True when the account was created but a session wasn't started because
   *  the email still needs to be confirmed. `user` is null in this case. */
  pendingConfirmation?: boolean;
};

export type Credentials = {
  email: string;
  password: string;
  name?: string;
};

export interface AuthProvider {
  /** Create an account and start a session. */
  signUp(creds: Credentials): Promise<AuthResult>;
  /** Verify credentials and start a session. */
  signIn(creds: Credentials): Promise<AuthResult>;
  /** End the current session. */
  signOut(): Promise<void>;
  /** Resolve the currently signed-in user, or null. */
  getUser(): Promise<AuthUser | null>;
  /** Re-send the confirmation email. Optional — providers that don't require
   *  email confirmation (e.g. the mock) can omit this. */
  resendConfirmation?(email: string): Promise<void>;
  /** Email a password-reset link. Optional. */
  requestPasswordReset?(email: string): Promise<void>;
  /** Set a new password for the currently-authenticated (recovery) session. */
  updatePassword?(password: string): Promise<{ error: string | null }>;
}

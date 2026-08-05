// In-memory mock auth provider for the prototype.
//
// - Users live in a module-level Map (persists for the life of the server
//   process; resets on restart — fine for a prototype).
// - Passwords are salted + scrypt-hashed (never stored in plaintext).
// - Sessions are an httpOnly cookie holding an opaque token.
//
// Swapping to Supabase later: replace this file with a provider that uses
// @supabase/ssr (createServerClient with the cookie store) and calls
// supabase.auth.signUp / signInWithPassword / signOut / getUser. The route
// handlers and client code stay identical.

import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AuthProvider, AuthResult, AuthUser, Credentials } from "./types";

const COOKIE = "ledger_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type UserRecord = AuthUser & { salt: string; hash: string };

// NOTE: module-level state — single-process only. Real persistence comes with Supabase.
const usersByEmail = new Map<string, UserRecord>();
const sessionsByToken = new Map<string, string>(); // token -> email

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

// Seed a known demo account so there's always something to log in with.
// (The store is in-memory and resets on server restart, so we re-seed here.)
(function seedDemoUser() {
  const email = "demo@ledger.app";
  const password = "password123";
  const salt = randomBytes(16).toString("hex");
  usersByEmail.set(email, {
    id: "usr_demo",
    email,
    name: "Demo User",
    createdAt: "2026-01-01T00:00:00.000Z",
    salt,
    hash: hashPassword(password, salt),
  });
})();

function stripSecrets(rec: UserRecord): AuthUser {
  const { id, email, name, createdAt } = rec;
  return { id, email, name, createdAt };
}

async function startSession(email: string) {
  const token = randomBytes(24).toString("hex");
  sessionsByToken.set(token, email);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export const mockAuthProvider: AuthProvider = {
  async signUp({ email, password, name }: Credentials): Promise<AuthResult> {
    email = email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return { user: null, error: "Enter a valid email address." };
    }
    if (password.length < 6) {
      return { user: null, error: "Password must be at least 6 characters." };
    }
    if (usersByEmail.has(email)) {
      return { user: null, error: "An account with this email already exists." };
    }
    const salt = randomBytes(16).toString("hex");
    const rec: UserRecord = {
      id: randomBytes(9).toString("hex"),
      email,
      name: name?.trim() || null,
      createdAt: new Date().toISOString(),
      salt,
      hash: hashPassword(password, salt),
    };
    usersByEmail.set(email, rec);
    await startSession(email);
    return { user: stripSecrets(rec), error: null };
  },

  async signIn({ email, password }: Credentials): Promise<AuthResult> {
    email = email.trim().toLowerCase();
    const rec = usersByEmail.get(email);
    if (!rec) {
      return { user: null, error: "No account found with this email." };
    }
    const attempt = Buffer.from(hashPassword(password, rec.salt), "hex");
    const stored = Buffer.from(rec.hash, "hex");
    if (attempt.length !== stored.length || !timingSafeEqual(attempt, stored)) {
      return { user: null, error: "Incorrect password." };
    }
    await startSession(email);
    return { user: stripSecrets(rec), error: null };
  },

  async signOut(): Promise<void> {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (token) sessionsByToken.delete(token);
    store.delete(COOKIE);
  },

  async getUser(): Promise<AuthUser | null> {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const email = sessionsByToken.get(token);
    if (!email) return null;
    const rec = usersByEmail.get(email);
    return rec ? stripSecrets(rec) : null;
  },

  // No email delivery in the mock — reset is a no-op (dev convenience).
  async requestPasswordReset(): Promise<void> {},

  async updatePassword(password: string): Promise<{ error: string | null }> {
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    const email = token ? sessionsByToken.get(token) : undefined;
    const rec = email ? usersByEmail.get(email) : undefined;
    if (!rec) return { error: "You must be signed in to change your password." };
    const salt = randomBytes(16).toString("hex");
    rec.salt = salt;
    rec.hash = hashPassword(password, salt);
    return { error: null };
  },
};

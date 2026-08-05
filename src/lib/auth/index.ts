import { mockAuthProvider } from "./mock-provider";
import { supabaseAuthProvider } from "./supabase-provider";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { AuthProvider } from "./types";

// Use Supabase when env vars are present; fall back to the in-memory mock
// (keeps local/dev working without a Supabase project).
export const auth: AuthProvider = isSupabaseConfigured()
  ? supabaseAuthProvider
  : mockAuthProvider;

export type { AuthUser, AuthResult, Credentials, AuthProvider } from "./types";

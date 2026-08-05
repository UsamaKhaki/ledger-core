"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api/client";
import type { AuthUser } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error: string | null; pending: boolean }>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  exportData: () => Promise<ExportBundle | null>;
  deleteAccount: () => Promise<{ error: string | null }>;
};

export type ExportBundle = {
  exportedAt: string;
  account: AuthUser;
  debts: unknown[];
  payments: unknown[];
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Pull an { error } string out of any non-200 response body.
function errorFrom(body: unknown): string {
  if (body && typeof body === "object" && "error" in body) {
    const e = (body as { error?: unknown }).error;
    if (typeof e === "string") return e;
  }
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await api.auth.me();
    setUser(res.status === 200 ? res.body.user : null);
    setLoading(false);
  }, []);

  // load the session once on mount (setState lives inside the async body)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.auth.me();
        if (!cancelled) setUser(res.status === 200 ? res.body.user : null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await api.auth.signup({ body: { email, password, name } });
      if (res.status === 200) {
        if (res.body.user) {
          setUser(res.body.user);
          return { error: null, pending: false };
        }
        // account created, awaiting email confirmation
        return { error: null, pending: true };
      }
      return { error: errorFrom(res.body), pending: false };
    },
    [],
  );

  const resendConfirmation = useCallback(async (email: string) => {
    await api.auth.resendConfirmation({ body: { email } });
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await api.auth.requestPasswordReset({ body: { email } });
  }, []);

  const exportData = useCallback(async () => {
    const res = await api.auth.exportData();
    return res.status === 200 ? (res.body as ExportBundle) : null;
  }, []);

  const deleteAccount = useCallback(async () => {
    const res = await api.auth.deleteAccount();
    if (res.status === 200) {
      setUser(null);
      return { error: null };
    }
    return { error: errorFrom(res.body) };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const res = await api.auth.updatePassword({ body: { password } });
    if (res.status === 200) {
      await refresh();
      return { error: null };
    }
    return { error: errorFrom(res.body) };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ body: { email, password } });
    if (res.status === 200) {
      setUser(res.body.user);
      return { error: null };
    }
    return { error: errorFrom(res.body) };
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        refresh,
        resendConfirmation,
        requestPasswordReset,
        updatePassword,
        exportData,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

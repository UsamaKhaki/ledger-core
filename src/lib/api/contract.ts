// ts-rest API contract — the single source of truth for every endpoint.
// Server (route handler) and client are both derived from this, so request and
// response shapes are guaranteed to match at compile time.
//
// Bodies/responses use `c.type<T>()` (pure TypeScript types, no runtime schema)
// to avoid a zod version dependency. When we move to Supabase we can add zod
// schemas here for runtime validation without changing callers.

import { initContract } from "@ts-rest/core";
import type { AuthUser } from "@/lib/auth/types";
import type { Debt, DebtInput, Payment, NotificationPrefs } from "@/lib/types";

const c = initContract();

export const authContract = c.router(
  {
    signup: {
      method: "POST",
      path: "/api/auth/signup",
      body: c.type<{ email: string; password: string; name?: string }>(),
      responses: {
        // user present → session started; user null + pendingConfirmation →
        // account created, awaiting email confirmation.
        200: c.type<{ user: AuthUser | null; pendingConfirmation?: boolean }>(),
        400: c.type<{ error: string }>(),
      },
      summary: "Create an account (starts a session, or awaits email confirmation)",
    },
    resendConfirmation: {
      method: "POST",
      path: "/api/auth/resend",
      body: c.type<{ email: string }>(),
      responses: {
        200: c.type<{ ok: boolean }>(),
      },
      summary: "Re-send the account confirmation email",
    },
    requestPasswordReset: {
      method: "POST",
      path: "/api/auth/reset-request",
      body: c.type<{ email: string }>(),
      responses: {
        // Always 200 — never reveal whether an email is registered.
        200: c.type<{ ok: boolean }>(),
      },
      summary: "Email a password-reset link",
    },
    updatePassword: {
      method: "POST",
      path: "/api/auth/update-password",
      body: c.type<{ password: string }>(),
      responses: {
        200: c.type<{ ok: boolean }>(),
        400: c.type<{ error: string }>(),
      },
      summary: "Set a new password for the current (recovery) session",
    },
    exportData: {
      method: "GET",
      path: "/api/auth/export",
      responses: {
        200: c.type<{
          exportedAt: string;
          account: AuthUser;
          debts: Debt[];
          payments: Payment[];
        }>(),
        401: c.type<{ error: string }>(),
      },
      summary: "Export all data held for the current user (GDPR access)",
    },
    deleteAccount: {
      method: "POST",
      path: "/api/auth/delete-account",
      body: c.noBody(),
      responses: {
        200: c.type<{ ok: boolean }>(),
        400: c.type<{ error: string }>(),
        401: c.type<{ error: string }>(),
      },
      summary: "Permanently delete the account and all its data (GDPR erasure)",
    },
    login: {
      method: "POST",
      path: "/api/auth/login",
      body: c.type<{ email: string; password: string }>(),
      responses: {
        200: c.type<{ user: AuthUser }>(),
        401: c.type<{ error: string }>(),
      },
      summary: "Sign in with email and password",
    },
    logout: {
      method: "POST",
      path: "/api/auth/logout",
      body: c.noBody(),
      responses: {
        200: c.type<{ ok: boolean }>(),
      },
      summary: "End the current session",
    },
    me: {
      method: "GET",
      path: "/api/auth/me",
      responses: {
        200: c.type<{ user: AuthUser | null }>(),
      },
      summary: "Get the currently signed-in user",
    },
  },
);

export const debtsContract = c.router({
  list: {
    method: "GET",
    path: "/api/debts",
    responses: {
      200: c.type<{ debts: Debt[] }>(),
      401: c.type<{ error: string }>(),
    },
    summary: "List all debts",
  },
  create: {
    method: "POST",
    path: "/api/debts",
    body: c.type<DebtInput>(),
    responses: {
      200: c.type<{ debt: Debt }>(),
      400: c.type<{ error: string }>(),
      401: c.type<{ error: string }>(),
      // Free-plan debt cap reached — enforced server-side, not just in the UI.
      403: c.type<{ error: string }>(),
    },
    summary: "Add a debt",
  },
  update: {
    method: "PATCH",
    path: "/api/debts/:id",
    body: c.type<Partial<DebtInput>>(),
    responses: {
      200: c.type<{ debt: Debt }>(),
      400: c.type<{ error: string }>(),
      401: c.type<{ error: string }>(),
      404: c.type<{ error: string }>(),
    },
    summary: "Edit a debt",
  },
  remove: {
    method: "DELETE",
    path: "/api/debts/:id",
    responses: {
      200: c.type<{ ok: boolean }>(),
      401: c.type<{ error: string }>(),
    },
    summary: "Delete a debt",
  },
  clear: {
    method: "POST",
    path: "/api/debts/clear",
    body: c.noBody(),
    responses: {
      200: c.type<{ ok: boolean }>(),
      401: c.type<{ error: string }>(),
    },
    summary: "Delete all debts and payments",
  },
});

export const paymentsContract = c.router({
  list: {
    method: "GET",
    path: "/api/payments",
    responses: {
      200: c.type<{ payments: Payment[] }>(),
      401: c.type<{ error: string }>(),
    },
    summary: "List logged payments",
  },
  log: {
    method: "POST",
    path: "/api/payments",
    body: c.type<{ debtId: string; amount: number }>(),
    responses: {
      200: c.type<{ payment: Payment; debt: Debt; cleared: boolean }>(),
      400: c.type<{ error: string }>(),
      401: c.type<{ error: string }>(),
      404: c.type<{ error: string }>(),
    },
    summary: "Log a payment against a debt",
  },
});

export const billingContract = c.router({
  status: {
    method: "GET",
    path: "/api/billing/status",
    responses: {
      200: c.type<{
        configured: boolean; // is Stripe wired up (vs. local simulation)?
        plan: "free" | "pro";
        isPro: boolean;
        billing?: "monthly" | "yearly" | null;
        status?: string | null; // Stripe subscription status
        currentPeriodEnd?: string | null;
      }>(),
    },
    summary: "Current user's subscription state (server truth)",
  },
  checkout: {
    method: "POST",
    path: "/api/billing/checkout",
    body: c.type<{ billing: "monthly" | "yearly" }>(),
    responses: {
      200: c.type<{ url: string }>(),
      400: c.type<{ error: string }>(),
      401: c.type<{ error: string }>(),
    },
    summary: "Create a Stripe Checkout session and return its URL",
  },
  portal: {
    method: "POST",
    path: "/api/billing/portal",
    body: c.noBody(),
    responses: {
      200: c.type<{ url: string }>(),
      400: c.type<{ error: string }>(),
      401: c.type<{ error: string }>(),
    },
    summary: "Create a Stripe Billing Portal session and return its URL",
  },
});

export const notificationsContract = c.router({
  get: {
    method: "GET",
    path: "/api/notifications",
    responses: { 200: c.type<NotificationPrefs>() },
    summary: "Get the current user's email notification preferences",
  },
  update: {
    method: "PATCH",
    path: "/api/notifications",
    body: c.type<Partial<NotificationPrefs>>(),
    responses: {
      200: c.type<NotificationPrefs>(),
      401: c.type<{ error: string }>(),
    },
    summary: "Update email notification preferences",
  },
});

// Top-level contract. Add future resources here.
export const contract = c.router({
  auth: authContract,
  debts: debtsContract,
  payments: paymentsContract,
  billing: billingContract,
  notifications: notificationsContract,
});

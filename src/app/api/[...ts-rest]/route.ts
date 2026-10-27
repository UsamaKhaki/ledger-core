// Single ts-rest handler mounted as a catch-all for every /api/* route.
// The router below implements the shared contract by delegating to the auth
// provider — swapping the provider (e.g. to Supabase) needs no changes here.

import { createNextHandler, tsr } from "@ts-rest/serverless/next";
import { contract } from "@/lib/api/contract";
import type { DebtInput } from "@/lib/types";
import { auth } from "@/lib/auth";
import { data } from "@/lib/api/data";
import { billing } from "@/lib/api/billing";
import { account } from "@/lib/api/account";
import { notifications } from "@/lib/api/notifications";
import {
  currentUser,
  debtLimitReached,
  validateDebtInput,
  validatePayment,
} from "@/lib/api/guards";

const router = tsr.router(contract, {
  auth: {
    signup: async ({ body }) => {
      const { user, error, pendingConfirmation } = await auth.signUp(body);
      if (pendingConfirmation) {
        return { status: 200, body: { user: null, pendingConfirmation: true } };
      }
      if (error || !user) {
        return { status: 400, body: { error: error ?? "Sign up failed." } };
      }
      return { status: 200, body: { user, pendingConfirmation: false } };
    },
    resendConfirmation: async ({ body }) => {
      await auth.resendConfirmation?.(body.email);
      return { status: 200, body: { ok: true } };
    },
    requestPasswordReset: async ({ body }) => {
      // Fire-and-forget; always report success so we don't leak which emails
      // are registered (account-enumeration protection).
      await auth.requestPasswordReset?.(body.email);
      return { status: 200, body: { ok: true } };
    },
    updatePassword: async ({ body }) => {
      if (!body.password || body.password.length < 6) {
        return {
          status: 400,
          body: { error: "Password must be at least 6 characters." },
        };
      }
      const result = await auth.updatePassword?.(body.password);
      if (result?.error) {
        return { status: 400, body: { error: result.error } };
      }
      return { status: 200, body: { ok: true } };
    },
    exportData: async () => {
      const bundle = await account.export();
      if (!bundle) {
        return { status: 401, body: { error: "Sign in to export your data." } };
      }
      return { status: 200, body: bundle };
    },
    deleteAccount: async () => {
      const { error, notSignedIn } = await account.remove();
      if (error) {
        return notSignedIn
          ? { status: 401, body: { error } }
          : { status: 400, body: { error } };
      }
      return { status: 200, body: { ok: true } };
    },
    login: async ({ body }) => {
      const { user, error } = await auth.signIn(body);
      if (error || !user) {
        return { status: 401, body: { error: error ?? "Sign in failed." } };
      }
      return { status: 200, body: { user } };
    },
    logout: async () => {
      await auth.signOut();
      return { status: 200, body: { ok: true } };
    },
    me: async () => {
      const user = await auth.getUser();
      return { status: 200, body: { user } };
    },
  },

  // Row-level security already scopes every query to the caller, so these can't
  // leak across accounts — but an anonymous request should say "sign in", not
  // hand back an empty 200 that renders as "you have no debts".
  debts: {
    list: async () => {
      if (!(await currentUser())) {
        return { status: 401, body: { error: "Sign in to see your debts." } };
      }
      return { status: 200, body: { debts: await data.listDebts() } };
    },
    create: async ({ body }) => {
      if (!(await currentUser())) {
        return { status: 401, body: { error: "Sign in to add a debt." } };
      }
      const valid = validateDebtInput(body, { partial: false });
      if (!valid.ok) return { status: 400, body: { error: valid.error } };

      const limit = await debtLimitReached();
      if (limit.reached) return { status: 403, body: { error: limit.error } };

      const debt = await data.createDebt(valid.value as DebtInput);
      if (!debt) return { status: 400, body: { error: "Could not add debt." } };
      return { status: 200, body: { debt } };
    },
    update: async ({ params, body }) => {
      if (!(await currentUser())) {
        return { status: 401, body: { error: "Sign in to edit this debt." } };
      }
      const valid = validateDebtInput(body, { partial: true });
      if (!valid.ok) return { status: 400, body: { error: valid.error } };
      const debt = await data.updateDebt(params.id, valid.value);
      if (!debt) return { status: 404, body: { error: "Debt not found." } };
      return { status: 200, body: { debt } };
    },
    remove: async ({ params }) => {
      if (!(await currentUser())) {
        return { status: 401, body: { error: "Sign in to delete this debt." } };
      }
      return { status: 200, body: { ok: await data.removeDebt(params.id) } };
    },
    clear: async () => {
      if (!(await currentUser())) {
        return { status: 401, body: { error: "Sign in to clear your data." } };
      }
      await data.clear();
      return { status: 200, body: { ok: true } };
    },
  },

  payments: {
    list: async () => {
      if (!(await currentUser())) {
        return { status: 401, body: { error: "Sign in to see your payments." } };
      }
      return { status: 200, body: { payments: await data.listPayments() } };
    },
    log: async ({ body }) => {
      if (!(await currentUser())) {
        return { status: 401, body: { error: "Sign in to log a payment." } };
      }
      const valid = validatePayment(body);
      if (!valid.ok) return { status: 400, body: { error: valid.error } };
      const result = await data.logPayment(valid.value.debtId, valid.value.amount);
      if (!result) return { status: 404, body: { error: "Debt not found." } };
      return { status: 200, body: result };
    },
  },

  billing: {
    status: async () => ({ status: 200, body: await billing.status() }),
    checkout: async ({ body }) => {
      const r = await billing.checkout(body.billing);
      if (r.url) return { status: 200, body: { url: r.url } };
      return r.status === 401
        ? { status: 401, body: { error: r.error ?? "Sign in to upgrade." } }
        : { status: 400, body: { error: r.error ?? "Checkout failed." } };
    },
    portal: async () => {
      const r = await billing.portal();
      if (r.url) return { status: 200, body: { url: r.url } };
      return r.status === 401
        ? { status: 401, body: { error: r.error ?? "Sign in to manage billing." } }
        : { status: 400, body: { error: r.error ?? "Could not open billing." } };
    },
  },

  notifications: {
    get: async () => ({ status: 200, body: await notifications.get() }),
    update: async ({ body }) => {
      const prefs = await notifications.update(body);
      if (!prefs) {
        return { status: 401, body: { error: "Sign in to change notifications." } };
      }
      return { status: 200, body: prefs };
    },
  },
});

const handler = createNextHandler(contract, router, {
  handlerType: "app-router",
});

// Every HTTP method the contract uses must be exported, or Next returns 405
// before ts-rest ever sees the request. PATCH → debts.update / notifications.update,
// DELETE → debts.remove. Keep this in sync when adding routes to the contract.
export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as DELETE,
};

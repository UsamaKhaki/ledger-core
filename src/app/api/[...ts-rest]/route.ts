// Single ts-rest handler mounted as a catch-all for every /api/* route.
// The router below implements the shared contract by delegating to the auth
// provider — swapping the provider (e.g. to Supabase) needs no changes here.

import { createNextHandler, tsr } from "@ts-rest/serverless/next";
import { contract } from "@/lib/api/contract";
import { auth } from "@/lib/auth";
import { data } from "@/lib/api/data";
import { billing } from "@/lib/api/billing";
import { account } from "@/lib/api/account";
import { notifications } from "@/lib/api/notifications";

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

  debts: {
    list: async () => ({ status: 200, body: { debts: await data.listDebts() } }),
    create: async ({ body }) => {
      if (!body.name?.trim() || !(body.balance > 0)) {
        return { status: 400, body: { error: "Name and a positive balance are required." } };
      }
      const debt = await data.createDebt(body);
      if (!debt) return { status: 400, body: { error: "Could not add debt." } };
      return { status: 200, body: { debt } };
    },
    update: async ({ params, body }) => {
      const debt = await data.updateDebt(params.id, body);
      if (!debt) return { status: 404, body: { error: "Debt not found." } };
      return { status: 200, body: { debt } };
    },
    remove: async ({ params }) => ({
      status: 200,
      body: { ok: await data.removeDebt(params.id) },
    }),
    clear: async () => {
      await data.clear();
      return { status: 200, body: { ok: true } };
    },
  },

  payments: {
    list: async () => ({
      status: 200,
      body: { payments: await data.listPayments() },
    }),
    log: async ({ body }) => {
      if (!(body.amount > 0)) {
        return { status: 400, body: { error: "Amount must be greater than 0." } };
      }
      const result = await data.logPayment(body.debtId, body.amount);
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

export { handler as GET, handler as POST };

import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy Policy",
  description: "How Ledger collects, uses, stores, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 3, 2026"
      intro="Ledger is a debt-payoff planner. This policy explains what we collect, why, how we protect it, and the rights you have over your information. We keep it in plain language on purpose."
    >
      <Section title="What we collect">
        <ul className="space-y-1.5">
          <li>
            <strong>Account details</strong> — your email address and, optionally,
            your name, used to sign you in and secure your account.
          </li>
          <li>
            <strong>Financial data you enter</strong> — the debts, balances,
            interest rates, and payments you add to build your plan.
          </li>
          <li>
            <strong>Preferences</strong> — settings like currency, theme, and
            reminders, stored locally in your browser.
          </li>
          <li>
            <strong>Payment information</strong> — if you subscribe to Pro,
            billing is handled by Stripe. We never receive or store your full card
            number; we keep only a Stripe customer reference and your subscription
            status.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>
          We use your information solely to provide the service: to calculate your
          payoff plan, save your progress, sign you in, process subscriptions, and
          send account and reminder notifications you&apos;ve opted into. We do not
          use your financial data for advertising.
        </p>
      </Section>

      <Section title="Where it&apos;s stored">
        <p>
          Your account and financial data are stored in a Postgres database
          (Supabase) with row-level security, so each account can only access its
          own records. Billing data is stored by Stripe under their security
          standards. Preferences remain in your browser&apos;s local storage.
        </p>
      </Section>

      <Section title="Sharing">
        <p>
          <strong>We do not sell your data.</strong> We share information only with
          the processors that run the service on our behalf — Supabase (database
          and authentication) and Stripe (payments) — and only as needed to
          operate Ledger. We may disclose information if required by law.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We use essential cookies to keep you signed in and maintain your secure
          session. We don&apos;t use advertising or third-party tracking cookies.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live (including the EU/UK under GDPR), you have
          the right to access, correct, export, and delete your personal data, and
          to withdraw consent. You can act on these directly:
        </p>
        <ul className="space-y-1.5">
          <li>
            <strong>Access &amp; portability</strong> — export everything we hold
            about you as JSON from <a href="/settings">Settings → Data &amp;
            privacy</a>.
          </li>
          <li>
            <strong>Erasure</strong> — permanently delete your account and all
            associated data from <a href="/settings">Settings → Danger zone</a>.
          </li>
          <li>
            <strong>Correction</strong> — edit your debts, payments, and profile
            at any time in the app.
          </li>
        </ul>
      </Section>

      <Section title="Data retention">
        <p>
          We keep your data while your account is active. When you delete your
          account, your profile, debts, and payment history are removed from our
          database, and your Stripe customer record is deleted. Backups and legal
          records may persist for a limited period as required.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data is encrypted in transit. Access is scoped per user with row-level
          security, and payment credentials never touch our servers. No system is
          perfectly secure, but we work to protect your information and limit what
          we collect.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Ledger isn&apos;t directed to anyone under 16, and we don&apos;t
          knowingly collect data from children.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update this policy as the product evolves. We&apos;ll revise the
          &ldquo;last updated&rdquo; date above and, for material changes, notify
          you in the app or by email.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions or requests about your data? Email{" "}
          <a href="mailto:privacy@ledger.app">privacy@ledger.app</a>.
        </p>
      </Section>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms of Service",
  description: "The terms that govern your use of Ledger.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="August 3, 2026"
      intro="These terms govern your use of Ledger. By creating an account or using the service, you agree to them. Please read the disclaimer below carefully — it matters."
    >
      <Section title="The service">
        <p>
          Ledger is a tool that helps you organize your debts and estimate a
          payoff plan using strategies like avalanche and snowball. It projects
          dates and interest based on the numbers you enter.
        </p>
      </Section>

      <Section title="Not financial advice">
        <p>
          <strong>
            Ledger provides estimates and educational tools, not financial,
            legal, tax, or investment advice.
          </strong>{" "}
          Projections assume the inputs and payment amounts you provide and
          don&apos;t account for every fee, rate change, or personal
          circumstance. Decisions about your money are your own; consider
          consulting a qualified professional before acting.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You&apos;re responsible for keeping your login credentials secure and
          for activity under your account. Provide accurate information, and let us
          know if you suspect unauthorized access. You must be at least 16 years
          old to use Ledger.
        </p>
      </Section>

      <Section title="Subscriptions & billing">
        <ul className="space-y-1.5">
          <li>
            Ledger Pro is offered on a monthly or yearly basis and billed through
            Stripe. By subscribing, you authorize recurring charges until you
            cancel.
          </li>
          <li>
            Subscriptions renew automatically at the end of each period. You can
            cancel anytime from <a href="/settings">Settings</a>; access continues
            until the end of the paid period.
          </li>
          <li>
            Prices are shown in USD and may change with notice. Except where
            required by law, payments are non-refundable.
          </li>
        </ul>
      </Section>

      <Section title="Acceptable use">
        <p>
          Don&apos;t misuse the service: no attempting to break security or access
          other users&apos; data, no reverse engineering, no unlawful use, and no
          activity that disrupts the service for others.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          The financial data you enter is yours. You grant us the limited
          permission needed to store and process it to operate the service. You
          can export or delete it at any time from Settings.
        </p>
      </Section>

      <Section title="Disclaimers">
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as
          available,&rdquo; without warranties of any kind, to the fullest extent
          permitted by law. We don&apos;t guarantee that projections will match
          real-world outcomes or that the service will be uninterrupted or
          error-free.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Ledger and its operators
          won&apos;t be liable for indirect, incidental, or consequential damages,
          or for any financial decisions made using the service. Nothing here
          limits liability that cannot be limited by law.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You can stop using Ledger and delete your account at any time. We may
          suspend or end access if these terms are violated or to protect the
          service and its users.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms as the product changes. We&apos;ll update the
          date above and, for material changes, give notice in the app or by
          email. Continued use after changes means you accept them.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:support@ledger.app">support@ledger.app</a>.
        </p>
      </Section>
    </LegalPage>
  );
}

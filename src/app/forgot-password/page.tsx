import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  alternates: { canonical: "/forgot-password" },
  title: "Reset your password",
  description: "Get a link to reset your Ledger password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

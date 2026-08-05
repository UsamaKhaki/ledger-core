import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Ledger plan.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}

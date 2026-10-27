import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  alternates: { canonical: "/signup" },
  title: "Create your account",
  description: "Start planning your way out of debt — free to start.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}

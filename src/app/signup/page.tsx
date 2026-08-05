import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start planning your way out of debt — free to start.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}

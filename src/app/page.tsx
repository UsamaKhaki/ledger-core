import type { Metadata } from "next";
import { Landing } from "@/components/Landing";

// A Server Component wrapper so the homepage can declare its own canonical —
// the landing UI itself is interactive and stays a Client Component.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <Landing />;
}

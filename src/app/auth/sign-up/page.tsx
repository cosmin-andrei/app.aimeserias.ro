import SignUpWizard from "@/components/Auth/SignUpWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Înregistrare",
};

export default function SignUpPage() {
  return <SignUpWizard />;
}

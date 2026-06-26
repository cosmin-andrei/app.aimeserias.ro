import { AuthCard } from "@/components/Auth/AuthCard";
import SigninWithPassword from "@/components/Auth/SigninWithPassword";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Autentificare",
};

export default function SignInPage() {
  return (
    <AuthCard
      title={
        <>
          Intră în
          <br />
          AiMeseriaș
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-[#9aa0a6]">Se încarcă...</p>}>
        <SigninWithPassword />
      </Suspense>
    </AuthCard>
  );
}

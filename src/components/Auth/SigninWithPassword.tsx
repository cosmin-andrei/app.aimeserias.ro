"use client";

import { AuthField, AuthLink, AuthSubmitButton } from "@/components/Auth/auth-fields";
import { login, fetchCurrentUser } from "@/lib/api-client";
import { getCompanyOnboardingPath, needsCompanyOnboarding } from "@/lib/company-account";
import { getAuthToken } from "@/lib/auth";
import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SigninWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordRef = useRef<HTMLInputElement>(null);
  const { loginAndLoadUser } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const isSubmitting = useRef(false);

  const justRegistered = searchParams.get("registered") === "1";
  const justRegisteredCompany = searchParams.get("registered") === "company";
  const returnUrl = searchParams.get("returnUrl") || "/";

  useEffect(() => {
    router.prefetch(returnUrl);
  }, [router, returnUrl]);

  useEffect(() => {
    if (getAuthToken()) {
      router.replace(returnUrl);
    }
  }, [router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting.current) return;

    setEmailError("");
    setPasswordError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    let valid = true;

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("Te rugăm să introduci un email valid.");
      valid = false;
    }

    if (!trimmedPassword) {
      setPasswordError("Te rugăm să introduci parola.");
      valid = false;
    }

    if (!valid) return;

    isSubmitting.current = true;
    setLoading(true);

    const result = await login(trimmedEmail, trimmedPassword);

    if (!result.success || !result.access_token) {
      setLoading(false);
      const message = result.error || "Autentificare eșuată.";
      if (message.toLowerCase().includes("email")) {
        setEmailError(message);
      } else {
        setPasswordError(message);
      }
      isSubmitting.current = false;
      return;
    }

    setTransitioning(true);
    await loginAndLoadUser(result.access_token);
    const user = await fetchCurrentUser();
    if (needsCompanyOnboarding(user)) {
      router.replace(getCompanyOnboardingPath());
      return;
    }
    router.replace(returnUrl);
  };

  if (transitioning) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 animate-auth-step-forward">
        <div className="size-8 animate-spin rounded-full border-2 border-[#2eb8f0] border-t-transparent" />
        <p className="text-sm text-[#9aa0a6]">Te autentificăm...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {justRegistered && (
        <div className="mb-4 rounded-lg border border-[#34a853]/40 bg-[#34a853]/10 px-4 py-3 text-sm text-[#81c995] animate-auth-step-forward">
          Contul a fost creat cu succes. Te poți autentifica acum.
        </div>
      )}
      {justRegisteredCompany && (
        <div className="mb-4 rounded-lg border border-[#2eb8f0]/40 bg-[#2eb8f0]/10 px-4 py-3 text-sm text-[#9ddcff] animate-auth-step-forward">
          Contul de firmă a fost creat. După autentificare vei parcurge verificarea
          firmei înainte de a accesa platforma.
        </div>
      )}

      <div className="mb-2">
        <AuthField
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          aria-label="Email"
          compact
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && email.trim()) {
              e.preventDefault();
              passwordRef.current?.focus();
            }
          }}
          error={emailError}
          errorId="email-error"
        />
      </div>

      <div>
        <AuthField
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          placeholder="Parola"
          autoComplete="current-password"
          aria-label="Parola"
          compact
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          error={passwordError}
          errorId="password-error"
        />

        <AuthLink
          href="/auth/forgot-password"
          className="mt-1 hidden md:inline-block"
        >
          Ai uitat parola?
        </AuthLink>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <AuthLink href="/auth/sign-up">Creează cont</AuthLink>
        <AuthSubmitButton loading={loading}>Înainte</AuthSubmitButton>
      </div>
    </form>
  );
}

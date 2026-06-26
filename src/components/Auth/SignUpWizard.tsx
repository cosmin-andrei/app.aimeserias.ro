"use client";

import { AuthCard } from "@/components/Auth/AuthCard";
import {
  AuthBackButton,
  AuthField,
  AuthLink,
  AuthSelect,
  AuthSubmitButton,
} from "@/components/Auth/auth-fields";
import { registerUser, sendRegisterEmailCode, verifyRegisterEmailCode } from "@/lib/api-client";
import { Building2, UserSearch, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StepDirection = "forward" | "back";

const TOTAL_STEPS = 5;

const STEP_SUBTITLES: Record<number, string> = {
  1: "Alege tipul de cont potrivit pentru tine.",
  2: "Spune-ne cum te numim.",
  3: "Spune-ne puțin despre tine.",
  4: "Introdu datele de contact",
  5: "Creează o parolă securizată",
};

type AccountType = "client" | "worker" | "company";

const ACCOUNT_TYPES: {
  id: AccountType;
  title: string;
  description: string;
  apiRole: "client" | "worker";
  icon: LucideIcon;
}[] = [
  {
    id: "client",
    title: "Beneficiar",
    description: "Caut meseriași pentru casa sau afacerea mea",
    apiRole: "client",
    icon: UserSearch,
  },
  {
    id: "worker",
    title: "Meseriaș",
    description: "Ofer servicii ca profesionist autorizat",
    apiRole: "worker",
    icon: Wrench,
  },
  {
    id: "company",
    title: "Companie",
    description: "Reprezint o companie sau o echipă de meseriași",
    apiRole: "worker",
    icon: Building2,
  },
];

const MONTHS = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

const NAME_REGEX = /^[A-Za-zĂăÂâÎîȘșȚț\s-]+$/;

type FormData = {
  account_type: AccountType | "";
  first_name: string;
  last_name: string;
  birth_day: string;
  birth_month: string;
  birth_year: string;
  gender: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
  terms: boolean;
  legal_representative_declaration: boolean;
};

type FormErrors = Partial<
  Record<keyof FormData | "birth_date" | "verification_code", string>
>;

function mapAccountTypeToRole(accountType: AccountType): "client" | "worker" {
  const found = ACCOUNT_TYPES.find((t) => t.id === accountType);
  return found?.apiRole ?? "client";
}

function mapGenderToApi(gender: string): string | undefined {
  if (gender === "masculin") return "M";
  if (gender === "feminin") return "F";
  return undefined;
}

function validateName(value: string, label: string): string | null {
  const val = value.trim();
  if (!val) return `${label} este obligatoriu.`;
  const lettersOnly = val.replace(/[\s-]/g, "");
  if (lettersOnly.length < 2) {
    return `${label} trebuie să conțină cel puțin 2 litere.`;
  }
  if (val.length > 50) return `${label} nu poate avea mai mult de 50 de caractere.`;
  if (!NAME_REGEX.test(val)) {
    return `${label} poate conține doar litere, spații și cratime.`;
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Parola este obligatorie.";
  const issues: string[] = [];
  if (password.length < 8) issues.push("minim 8 caractere");
  if (!/[A-Z]/.test(password)) issues.push("o literă mare");
  if (!/[a-z]/.test(password)) issues.push("o literă mică");
  if (!/\d/.test(password)) issues.push("o cifră");
  if (issues.length) return `Parola trebuie să conțină ${issues.join(", ")}.`;
  return null;
}

function PasswordRequirements({ password }: { password: string }) {
  const rules = [
    { key: "length", label: "Minim 8 caractere", valid: password.length >= 8 },
    { key: "upper", label: "O literă mare", valid: /[A-Z]/.test(password) },
    { key: "lower", label: "O literă mică", valid: /[a-z]/.test(password) },
    { key: "digit", label: "O cifră", valid: /\d/.test(password) },
  ];

  return (
    <div className="mt-2 flex flex-col gap-1">
      {rules.map((rule) => (
        <div
          key={rule.key}
          className={`flex items-center gap-2 text-xs ${rule.valid ? "text-[#34a853]" : "text-[#9aa0a6]"}`}
        >
          <span className="w-4 text-center">{rule.valid ? "✓" : "○"}</span>
          {rule.label}
        </div>
      ))}
    </div>
  );
}

export default function SignUpWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<StepDirection>("forward");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [data, setData] = useState<FormData>({
    account_type: "",
    first_name: "",
    last_name: "",
    birth_day: "",
    birth_month: "",
    birth_year: "",
    gender: "",
    email: "",
    phone: "",
    password: "",
    password_confirm: "",
    terms: false,
    legal_representative_declaration: false,
  });
  const [registeredAsCompany, setRegisteredAsCompany] = useState(false);

  const years = useMemo(() => {
    const maxYear = new Date().getFullYear() - 14;
    const result: number[] = [];
    for (let y = maxYear; y >= 1920; y--) result.push(y);
    return result;
  }, []);

  useEffect(() => {
    if (!registrationSuccess) return;
    const timer = window.setTimeout(() => {
      router.replace(
        registeredAsCompany
          ? "/auth/sign-in?registered=company"
          : "/auth/sign-in?registered=1"
      );
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [registrationSuccess, registeredAsCompany, router]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "account_type") {
        next.legal_representative_declaration = false;
      }
      return next;
    });
    if (key === "email") {
      setEmailCodeSent(false);
      setVerificationCode("");
      setVerifiedEmail(null);
      setEmailVerificationToken(null);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      if (key === "birth_day" || key === "birth_month" || key === "birth_year") {
        delete next.birth_date;
      }
      return next;
    });
    if (formError) setFormError(null);
  };

  const validateStep = (currentStep: number): boolean => {
    const nextErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!data.account_type) {
        nextErrors.account_type = "Te rugăm să alegi tipul de cont.";
      }
    }

    if (currentStep === 2) {
      const firstErr = validateName(data.first_name, "Prenumele");
      const lastErr = validateName(data.last_name, "Numele de familie");
      if (firstErr) nextErrors.first_name = firstErr;
      if (lastErr) nextErrors.last_name = lastErr;
      if (data.account_type === "company" && !data.legal_representative_declaration) {
        nextErrors.legal_representative_declaration =
          "Trebuie să confirmi că ești reprezentantul legal al firmei.";
      }
    }

    if (currentStep === 3) {
      if (!data.birth_day || !data.birth_month || !data.birth_year) {
        nextErrors.birth_date = "Te rugăm să completezi data nașterii.";
      } else {
        const birth = new Date(
          Number(data.birth_year),
          Number(data.birth_month) - 1,
          Number(data.birth_day)
        );
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const md = today.getMonth() - birth.getMonth();
        if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 14) {
          nextErrors.birth_date =
            "Trebuie să ai cel puțin 14 ani pentru a te înregistra.";
        }
      }
      if (!data.gender) {
        nextErrors.gender = "Te rugăm să selectezi genul.";
      }
    }

    if (currentStep === 4) {
      const email = data.email.trim();
      if (!email) {
        nextErrors.email = "Adresa de email este obligatorie.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        nextErrors.email = "Formatul adresei de email este invalid.";
      }

      const phone = data.phone.trim();
      if (!phone) {
        nextErrors.phone = "Numărul de telefon este obligatoriu.";
      } else if (!/^07\d{8}$/.test(phone)) {
        nextErrors.phone =
          "Numărul de telefon trebuie să fie în format 07XXXXXXXX.";
      }
    }

    if (currentStep === 5) {
      const passErr = validatePassword(data.password);
      if (passErr) nextErrors.password = passErr;
      if (!data.password_confirm) {
        nextErrors.password_confirm = "Te rugăm să confirmi parola.";
      } else if (data.password !== data.password_confirm) {
        nextErrors.password_confirm = "Parolele nu coincid.";
      }
      if (!data.terms) {
        nextErrors.terms = "Trebuie să accepți termenii și condițiile.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 4) {
      const email = data.email.trim();

      if (verifiedEmail === email && emailVerificationToken) {
        setDirection("forward");
        setStep((s) => s + 1);
        return;
      }

      if (!emailCodeSent) {
        setLoading(true);
        setFormError(null);
        const result = await sendRegisterEmailCode(email);
        setLoading(false);
        if (!result.success) {
          if (result.error?.includes("deja un cont")) {
            setErrors({ email: result.error });
          } else {
            setFormError(result.error || "Nu am putut trimite codul.");
          }
          return;
        }
        setEmailCodeSent(true);
        return;
      }

      if (!verificationCode.trim()) {
        setErrors({ verification_code: "Introdu codul primit pe email." });
        return;
      }

      setLoading(true);
      setFormError(null);
      const verifyResult = await verifyRegisterEmailCode(email, verificationCode);
      setLoading(false);
      if (!verifyResult.success) {
        setErrors({
          verification_code: verifyResult.error || "Cod invalid.",
        });
        return;
      }

      setVerifiedEmail(email);
      setEmailVerificationToken(verifyResult.verification_token || null);
      setDirection("forward");
      setStep((s) => s + 1);
      return;
    }

    if (step < TOTAL_STEPS) {
      setDirection("forward");
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setFormError(null);

    if (!emailVerificationToken) {
      setLoading(false);
      setFormError("Verifică adresa de email înainte de a crea contul.");
      setStep(4);
      setEmailCodeSent(true);
      return;
    }

    const birth_date = `${data.birth_year}-${String(data.birth_month).padStart(2, "0")}-${String(data.birth_day).padStart(2, "0")}`;
    const gender = mapGenderToApi(data.gender);

    const result = await registerUser({
      email: data.email.trim(),
      password: data.password,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      phone: data.phone.trim(),
      birth_date,
      email_verification_token: emailVerificationToken,
      ...(gender ? { gender } : {}),
      role: mapAccountTypeToRole(data.account_type as AccountType),
      ...(data.account_type === "company"
        ? {
            registration_type: "company" as const,
            legal_representative_declaration: data.legal_representative_declaration,
          }
        : {}),
    });

    setLoading(false);

    if (!result.success) {
      setFormError(result.error || "Înregistrare eșuată.");
      return;
    }

    setRegisteredAsCompany(data.account_type === "company");
    setRegistrationSuccess(true);
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection("back");
      setStep((s) => s - 1);
    }
  };

  const handleResendCode = async () => {
    const email = data.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Introdu o adresă de email validă." });
      return;
    }

    setLoading(true);
    setFormError(null);
    const result = await sendRegisterEmailCode(email);
    setLoading(false);
    if (!result.success) {
      setFormError(result.error || "Nu am putut retrimite codul.");
      return;
    }
    setEmailCodeSent(true);
    setVerificationCode("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.verification_code;
      return next;
    });
  };

  const stepAnimation =
    direction === "forward"
      ? "animate-auth-step-forward"
      : "animate-auth-step-back";

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-3">
          {ACCOUNT_TYPES.map((type) => {
            const selected = data.account_type === type.id;
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setField("account_type", type.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#2eb8f0] bg-[#2eb8f0]/10"
                    : "border-[rgba(95,99,104,0.5)] hover:border-[#2eb8f0]/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      selected
                        ? "bg-[#2eb8f0]/20 text-[#2eb8f0]"
                        : "bg-[#3c4043] text-[#9aa0a6]"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-medium ${selected ? "text-[#2eb8f0]" : "text-[#e8eaed]"}`}
                    >
                      {type.title}
                    </span>
                    <span className="mt-1 block text-xs text-[#9aa0a6]">
                      {type.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          {errors.account_type && (
            <p className="text-left text-[13px] text-[#ea4335]">
              {errors.account_type}
            </p>
          )}
        </div>
      );
    }

    if (step === 2) {
      const isCompany = data.account_type === "company";
      const declared = data.legal_representative_declaration;

      return (
        <div>
          <div className="mb-2">
            <AuthField
              name="first_name"
              placeholder="Prenume"
              compact
              value={data.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
              error={errors.first_name}
              errorId="first-name-error"
            />
          </div>
          <AuthField
            name="last_name"
            placeholder="Nume"
            compact
            value={data.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            error={errors.last_name}
            errorId="last-name-error"
          />
          {isCompany && (
            <button
              type="button"
              role="checkbox"
              aria-checked={declared}
              onClick={() =>
                setField("legal_representative_declaration", !declared)
              }
              className={`mt-4 flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                declared
                  ? "border-[#2eb8f0] bg-[#2eb8f0]/10"
                  : "border-[rgba(95,99,104,0.5)] hover:border-[#2eb8f0]/60"
              }`}
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                  declared
                    ? "border-[#2eb8f0] bg-[#2eb8f0] text-white"
                    : "border-[#5f6368] bg-transparent"
                }`}
                aria-hidden
              >
                {declared ? (
                  <svg className="size-3" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    declared ? "text-[#2eb8f0]" : "text-[#e8eaed]"
                  }`}
                >
                  Declar că sunt reprezentantul legal
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#9aa0a6]">
                  Confirm pe propria răspundere că sunt autorizat să reprezint compania
                  în relația cu AiMeseriaș.
                </span>
              </span>
            </button>
          )}
          {errors.legal_representative_declaration && (
            <p className="mt-2 text-left text-[13px] text-[#ea4335]">
              {errors.legal_representative_declaration}
            </p>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div>
          <div className="mb-1 flex gap-2">
            <div className="w-[4.75rem] shrink-0">
              <AuthSelect
                name="birth_day"
                value={data.birth_day}
                onChange={(e) => setField("birth_day", e.target.value)}
                error={errors.birth_day}
                errorId="birth-day-error"
                className="px-2 text-sm"
              >
                <option value="" disabled>
                  Zi
                </option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={String(day)}>
                    {day}
                  </option>
                ))}
              </AuthSelect>
            </div>
            <div className="min-w-0 flex-1">
              <AuthSelect
                name="birth_month"
                value={data.birth_month}
                onChange={(e) => setField("birth_month", e.target.value)}
                error={errors.birth_month}
                errorId="birth-month-error"
                className="px-2 text-sm"
              >
                <option value="" disabled>
                  Luna
                </option>
                {MONTHS.map((month, index) => (
                  <option key={month} value={String(index + 1)}>
                    {month}
                  </option>
                ))}
              </AuthSelect>
            </div>
            <div className="w-[5.5rem] shrink-0">
              <AuthSelect
                name="birth_year"
                value={data.birth_year}
                onChange={(e) => setField("birth_year", e.target.value)}
                error={errors.birth_year}
                errorId="birth-year-error"
                className="px-2 text-sm"
              >
                <option value="" disabled>
                  An
                </option>
                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </AuthSelect>
            </div>
          </div>
          {errors.birth_date && (
            <p className="mb-2 text-left text-[13px] text-[#ea4335]">
              {errors.birth_date}
            </p>
          )}
          <AuthSelect
            name="gender"
            value={data.gender}
            onChange={(e) => setField("gender", e.target.value)}
            error={errors.gender}
            errorId="gender-error"
          >
            <option value="" disabled>
              Selectează genul
            </option>
            <option value="masculin">Masculin</option>
            <option value="feminin">Feminin</option>
            <option value="altul">Altul</option>
            <option value="prefer_nu_spun">Prefer să nu spun</option>
          </AuthSelect>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div>
          <div className="mb-2">
            <AuthField
              name="email"
              type="email"
              placeholder="E-mail"
              autoComplete="email"
              compact
              value={data.email}
              onChange={(e) => setField("email", e.target.value)}
              error={errors.email}
              errorId="email-error"
            />
          </div>
          {emailCodeSent && verifiedEmail !== data.email.trim() && (
            <>
              <p className="mb-2 text-sm text-[#9aa0a6]">
                Am trimis un cod la{" "}
                <span className="text-[#e8eaed]">{data.email.trim()}</span>.
              </p>
              <AuthField
                name="verification_code"
                type="text"
                inputMode="numeric"
                placeholder="Cod din email (6 cifre)"
                autoComplete="one-time-code"
                compact
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  );
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.verification_code;
                    return next;
                  });
                }}
                error={errors.verification_code}
                errorId="verification-code-error"
              />
              <button
                type="button"
                onClick={() => void handleResendCode()}
                disabled={loading}
                className="mb-2 text-sm font-medium text-[#2eb8f0] transition hover:text-[#1aa3db] disabled:text-[#9aa0a6]"
              >
                Retrimite codul
              </button>
            </>
          )}
          {verifiedEmail === data.email.trim() && (
            <p className="mb-2 text-sm text-[#34a853]">✓ Email verificat</p>
          )}
          <AuthField
            name="phone"
            type="tel"
            placeholder="Telefon (07XXXXXXXX)"
            autoComplete="tel"
            compact
            value={data.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={errors.phone}
            errorId="phone-error"
          />
        </div>
      );
    }

    return (
      <div>
        <AuthField
          name="password"
          type="password"
          placeholder="Parolă"
          autoComplete="new-password"
          compact
          value={data.password}
          onChange={(e) => setField("password", e.target.value)}
          error={errors.password}
          errorId="password-error"
        />
        <PasswordRequirements password={data.password} />
        <div className="mt-2">
          <AuthField
            name="password_confirm"
            type="password"
            placeholder="Confirmă parola"
            autoComplete="new-password"
            compact
            value={data.password_confirm}
            onChange={(e) => setField("password_confirm", e.target.value)}
            error={errors.password_confirm}
            errorId="password-confirm-error"
          />
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm leading-relaxed text-[#e8eaed]">
          <input
            type="checkbox"
            checked={data.terms}
            onChange={(e) => setField("terms", e.target.checked)}
            className="mt-1 accent-[#1a4d78]"
          />
          <span>
            Prin crearea contului, îți exprimi acordul privind{" "}
            <Link
              href="https://aimeserias.ro/terms"
              target="_blank"
              className="text-[#2eb8f0] no-underline hover:text-[#1aa3db]"
            >
              Condițiile de utilizare
            </Link>{" "}
            și{" "}
            <Link
              href="https://aimeserias.ro/privacy"
              target="_blank"
              className="text-[#2eb8f0] no-underline hover:text-[#1aa3db]"
            >
              Politica de confidențialitate
            </Link>
            .
          </span>
        </label>
        {errors.terms && (
          <p className="mt-1 text-left text-[13px] text-[#ea4335]">
            {errors.terms}
          </p>
        )}
      </div>
    );
  };

  if (registrationSuccess) {
    return (
      <AuthCard
        title="Cont creat cu succes!"
        subtitle="Te redirecționăm către autentificare..."
      >
        <div className="flex flex-col items-center gap-5 py-4 animate-auth-step-forward">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#34a853]/20 text-3xl text-[#34a853]">
            ✓
          </div>
          <p className="text-center text-sm leading-relaxed text-[#9aa0a6]">
            {registeredAsCompany
              ? "Contul a fost creat. După autentificare vei completa verificarea firmei (date legale, documente, aprobare administrator și abonament Firmă)."
              : "Contul tău a fost creat. Poți să te autentifici cu emailul și parola alese."}
          </p>
          <AuthLink
            href={
              registeredAsCompany
                ? "/auth/sign-in?registered=company"
                : "/auth/sign-in?registered=1"
            }
          >
            Mergi la autentificare
          </AuthLink>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={
        <>
          Creează-ți contul
          <br />
          pe AiMeseriaș
        </>
      }
      subtitle={
        step === 4 && emailCodeSent && verifiedEmail !== data.email.trim()
          ? "Introdu codul primit pe email."
          : STEP_SUBTITLES[step]
      }
      subtitleStep={step}
      stepDirection={direction}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleNext();
        }}
        noValidate
        className="flex flex-col"
      >
        {formError && (
          <p className="mb-3 text-left text-[13px] text-[#ea4335]">{formError}</p>
        )}

        <div key={step} className={stepAnimation}>
          {renderStepContent()}
        </div>

        <div
          className={`mt-5 flex items-center gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}
        >
          <AuthBackButton onClick={handleBack} visible={step > 1} />
          <div className="flex items-center gap-3">
            {step === 1 && (
              <AuthLink href="/auth/sign-in">Autentificare</AuthLink>
            )}
            <AuthSubmitButton loading={loading}>
              {step === TOTAL_STEPS
                ? "Creează contul"
                : step === 4 && !emailCodeSent
                  ? "Trimite codul"
                  : step === 4 && verifiedEmail !== data.email.trim()
                    ? "Verifică"
                    : "Înainte"}
            </AuthSubmitButton>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}

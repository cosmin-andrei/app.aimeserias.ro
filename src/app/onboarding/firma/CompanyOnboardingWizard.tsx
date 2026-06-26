"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Upload,
  Users,
} from "lucide-react";
import { AuthCard } from "@/components/Auth/AuthCard";
import {
  AuthBackButton,
  AuthField,
  AuthSelect,
  AuthSubmitButton,
} from "@/components/Auth/auth-fields";
import {
  fetchCompanyByCui,
  saveCompanyDraft,
  submitCompanyVerification,
  type AppUser,
  type CompanyVerificationPayload,
} from "@/lib/api-client";
import {
  mapCompanyLookupToForm,
  matchesCompanyAdministrator,
  type CompanyLookupData,
} from "@/lib/company-lookup";
import type { CompanyStatus } from "@/lib/company-account";
import { useUser } from "@/hooks/useUser";

const TOTAL_STEPS = 4;

const STEP_TITLES: Record<number, string> = {
  1: "CUI companie",
  2: "Date companie",
  3: "Reprezentant legal",
  4: "Documente",
};

const STEP_HINTS: Record<number, string> = {
  1: "Datele se preiau automat din ANAF și ONRC.",
  2: "Verifică și corectează dacă e nevoie.",
  3: "Confirmă că reprezinți compania în relația cu AiMeseriaș.",
  4: "Încarcă documentele necesare pentru verificare.",
};

const LEGAL_FORMS = ["SRL", "SA", "II", "IF", "Altă formă"];

type CompanyDocumentKey =
  | "registration_certificate"
  | "rep_id"
  | "rep_authorization";

type ExistingCompanyDocuments = {
  registrationCertificate: string | null;
  repId: string | null;
  repAuthorization: string | null;
};

const INPUT_CLASS =
  "w-full rounded-lg border border-[rgba(95,99,104,0.5)] bg-transparent px-[15px] py-[13px] text-base text-[#e8eaed] transition-all placeholder:text-[#9aa0a6] focus:border-[#007bff] focus:outline-none focus:shadow-[0_0_0_1px_#007bff]";

type CompanyOnboardingWizardProps = {
  profile: AppUser;
  initialForm: CompanyVerificationPayload;
  existingDocuments: ExistingCompanyDocuments;
  status: CompanyStatus;
  rejectionReason?: string | null;
  onSubmitted: (user: AppUser) => Promise<void>;
};

export function CompanyOnboardingWizard({
  profile,
  initialForm,
  existingDocuments,
  status,
  rejectionReason,
  onSubmitted,
}: CompanyOnboardingWizardProps) {
  const { refetch: refetchUser } = useUser();
  const registrationInputRef = useRef<HTMLInputElement>(null);
  const repIdInputRef = useRef<HTMLInputElement>(null);
  const repAuthInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuiInput, setCuiInput] = useState(initialForm.company_cui || "");
  const [form, setForm] = useState<CompanyVerificationPayload>(initialForm);
  const [lookupData, setLookupData] = useState<CompanyLookupData | null>(null);
  const [lookupMeta, setLookupMeta] = useState<{ cached?: boolean; source?: string } | null>(
    null
  );
  const [lookupFetchedForCui, setLookupFetchedForCui] = useState(
    initialForm.company_cui || ""
  );
  const [legalRepConfirmed, setLegalRepConfirmed] = useState(false);
  const [documents, setDocuments] = useState<{
    registrationCertificate: File | null;
    repId: File | null;
    repAuthorization: File | null;
  }>({
    registrationCertificate: null,
    repId: null,
    repAuthorization: null,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    const existingCui = initialForm.company_cui?.trim().replace(/^RO/i, "").replace(/\D/g, "");
    if (!existingCui || lookupData) return;
    void fetchLookup(existingCui);
  }, []);

  const representativeName = `${profile.first_name} ${profile.last_name}`.trim();
  const administrators = lookupData?.administrators ?? [];
  const nameMatchesOnrc = matchesCompanyAdministrator(
    profile.first_name,
    profile.last_name,
    administrators
  );
  const requiresRepAuthorization = !nameMatchesOnrc;

  const stepAnimation =
    direction === "forward" ? "animate-auth-step-forward" : "animate-auth-step-back";

  const setFormField = <K extends keyof CompanyVerificationPayload>(
    key: K,
    value: CompanyVerificationPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (error) setError(null);
  };

  const fetchLookup = async (cui: string) => {
    setLoading(true);
    setError(null);
    const result = await fetchCompanyByCui(cui);
    setLoading(false);

    if (!result.success || !result.data) {
      setError(result.error || "Nu am putut prelua datele firmei.");
      return false;
    }

    const mapped = mapCompanyLookupToForm(result.data);
    setLookupData(result.data);
    setLookupMeta(result.meta || null);
    setForm(mapped);
    setCuiInput(String(result.data.cui || cui));
    setLookupFetchedForCui(String(result.data.cui || cui).replace(/^RO/i, ""));
    setLegalRepConfirmed(false);

    const draftResult = await saveCompanyDraft(mapped);
    if (draftResult.success) {
      await refetchUser();
    }

    return true;
  };

  const validateStep = (currentStep: number): boolean => {
    const nextErrors: Partial<Record<string, string>> = {};

    if (currentStep === 1) {
      const normalized = cuiInput.trim().replace(/^RO/i, "").replace(/\D/g, "");
      if (!/^\d{1,10}$/.test(normalized)) {
        nextErrors.cui = "Introdu un CUI valid (1–10 cifre).";
      }
    }

    if (currentStep === 2) {
      if (!form.company_name.trim()) nextErrors.company_name = "Denumirea este obligatorie.";
      if (!form.company_reg_com.trim()) {
        nextErrors.company_reg_com = "Nr. Reg. Comerțului este obligatoriu.";
      }
      if (!form.company_address.trim()) nextErrors.company_address = "Adresa este obligatorie.";
    }

    if (currentStep === 3 && !legalRepConfirmed) {
      nextErrors.legal_rep = "Trebuie să confirmi calitatea de reprezentant legal.";
    }

    if (currentStep === 4) {
      if (!documents.registrationCertificate && !existingDocuments.registrationCertificate) {
        nextErrors.registration_certificate = "Certificatul de înregistrare este obligatoriu.";
      }
      if (!documents.repId && !existingDocuments.repId) {
        nextErrors.rep_id = "Actul de identitate al reprezentantului este obligatoriu.";
      }
      if (
        requiresRepAuthorization &&
        !documents.repAuthorization &&
        !existingDocuments.repAuthorization
      ) {
        nextErrors.rep_authorization =
          "Dovada dreptului de reprezentare este obligatorie.";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 1) {
      const normalized = cuiInput.trim().replace(/^RO/i, "").replace(/\D/g, "");
      if (lookupFetchedForCui !== normalized) {
        const ok = await fetchLookup(normalized);
        if (!ok) return;
      }
      setDirection("forward");
      setStep(2);
      return;
    }

    if (step === 2) {
      setLoading(true);
      setError(null);
      const draftResult = await saveCompanyDraft(form);
      setLoading(false);
      if (!draftResult.success) {
        setError(draftResult.error || "Nu am putut salva datele companiei.");
        return;
      }
      await refetchUser();
      setDirection("forward");
      setStep(3);
      return;
    }

    if (step < TOTAL_STEPS) {
      setDirection("forward");
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await submitCompanyVerification(
      form,
      {
        registrationCertificate: documents.registrationCertificate,
        repId: documents.repId,
        repAuthorization: documents.repAuthorization,
      },
      { requiresRepAuthorization }
    );
    setLoading(false);

    if (!result.success || !result.user) {
      setError(result.error || "Nu am putut trimite datele companiei.");
      return;
    }

    await onSubmitted(result.user);
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection("back");
      setStep((s) => s - 1);
      setError(null);
    }
  };

  const renderInfoPanel = (
    title: string,
    children: ReactNode,
    icon?: ReactNode
  ) => (
    <div className="rounded-xl border border-[rgba(95,99,104,0.35)] bg-[#1a1d24] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#e8eaed]">
        {icon}
        {title}
      </div>
      <div className="text-sm text-[#9aa0a6]">{children}</div>
    </div>
  );

  const normalizedCuiInput = cuiInput.trim().replace(/^RO/i, "").replace(/\D/g, "");

  const setDocument = (
    key: keyof typeof documents,
    file: File | null,
    errorKey: CompanyDocumentKey
  ) => {
    setDocuments((prev) => ({ ...prev, [key]: file }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  };

  const renderDocumentUpload = (
    label: string,
    description: string,
    inputRef: RefObject<HTMLInputElement | null>,
    selectedFile: File | null,
    existingUrl: string | null,
    errorKey: CompanyDocumentKey,
    onSelect: (file: File | null) => void
  ) => (
    <div className="rounded-2xl border border-[rgba(95,99,104,0.35)] bg-[#1a1d24]/80 p-4">
      <p className="text-sm font-medium text-[#e8eaed]">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#9aa0a6]">{description}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(95,99,104,0.5)] bg-[#14171c] px-4 py-5 text-sm text-[#9aa0a6] transition hover:border-[#2eb8f0]/50"
      >
        <Upload className="size-4 shrink-0" aria-hidden />
        {selectedFile
          ? selectedFile.name
          : existingUrl
            ? "Înlocuiește documentul încărcat"
            : "Selectează fișierul (PDF, JPG, PNG)"}
      </button>
      {existingUrl && !selectedFile && (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-[#2eb8f0] hover:underline"
        >
          Vezi documentul curent
        </a>
      )}
      {fieldErrors[errorKey] && (
        <p className="mt-2 text-[13px] text-[#ea4335]">{fieldErrors[errorKey]}</p>
      )}
    </div>
  );

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div>
          <p className="mb-4 text-sm leading-relaxed text-[#9aa0a6]">{STEP_HINTS[1]}</p>
          <div className="rounded-2xl border border-[rgba(95,99,104,0.35)] bg-[#1a1d24]/80 p-5">
            <label
              htmlFor="company-cui"
              className="mb-2 block text-sm font-medium text-[#e8eaed]"
            >
              Cod Unic de Înregistrare
            </label>
            <AuthField
              id="company-cui"
              name="company_cui"
              placeholder="ex. 14399840"
              inputMode="numeric"
              autoComplete="off"
              compact
              value={cuiInput}
              onChange={(e) => {
                setCuiInput(e.target.value);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.cui;
                  return next;
                });
                if (error) setError(null);
              }}
              error={fieldErrors.cui}
              errorId="cui-error"
            />
            <p className="mt-2 text-xs text-[#5f6368]">1–10 cifre, fără prefix RO</p>
          </div>
          {lookupData && lookupFetchedForCui === normalizedCuiInput && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{lookupData.name}</p>
                <p className="mt-1 text-emerald-200/80">{lookupData.address}</p>
                {lookupMeta?.cached && (
                  <p className="mt-2 text-xs text-emerald-200/60">Date din cache (24h)</p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[#9aa0a6]">{STEP_HINTS[2]}</p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9aa0a6]">
              Denumire companie
            </label>
            <input
              className={INPUT_CLASS}
              value={form.company_name}
              onChange={(e) => setFormField("company_name", e.target.value)}
            />
            {fieldErrors.company_name && (
              <p className="mt-1 text-[13px] text-[#ea4335]">{fieldErrors.company_name}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9aa0a6]">CUI</label>
              <input className={INPUT_CLASS} value={form.company_cui} readOnly />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9aa0a6]">
                Nr. Reg. Comerțului
              </label>
              <input
                className={INPUT_CLASS}
                value={form.company_reg_com}
                onChange={(e) => setFormField("company_reg_com", e.target.value)}
              />
              {fieldErrors.company_reg_com && (
                <p className="mt-1 text-[13px] text-[#ea4335]">{fieldErrors.company_reg_com}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9aa0a6]">
              Formă juridică
            </label>
            <AuthSelect
              name="company_legal_form"
              value={form.company_legal_form}
              onChange={(e) => setFormField("company_legal_form", e.target.value)}
              compact
            >
              {LEGAL_FORMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              {!LEGAL_FORMS.includes(form.company_legal_form) && form.company_legal_form && (
                <option value={form.company_legal_form}>{form.company_legal_form}</option>
              )}
            </AuthSelect>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9aa0a6]">
              Sediu social
            </label>
            <input
              className={INPUT_CLASS}
              value={form.company_address}
              onChange={(e) => setFormField("company_address", e.target.value)}
            />
            {fieldErrors.company_address && (
              <p className="mt-1 text-[13px] text-[#ea4335]">{fieldErrors.company_address}</p>
            )}
          </div>

          {lookupData && (
            <div className="space-y-3">
              {lookupData.inactive && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>Firma apare ca inactivă în registrele ANAF.</p>
                </div>
              )}

              {renderInfoPanel(
                "Status ONRC",
                <>
                  <p>{lookupData.onrcStatusLabel || "—"}</p>
                  {lookupData.registrationState && (
                    <p className="mt-1 text-xs">{lookupData.registrationState}</p>
                  )}
                </>
              )}

              {administrators.length > 0 &&
                renderInfoPanel(
                  "Administratori ONRC",
                  <ul className="space-y-1.5">
                    {administrators.map((admin) => (
                      <li key={`${admin.personId ?? admin.name}`}>
                        <span className="text-[#e8eaed]">{admin.name}</span>
                        <span className="text-xs text-[#9aa0a6]"> · {admin.role}</span>
                      </li>
                    ))}
                  </ul>,
                  <Users className="size-4 text-[#2eb8f0]" aria-hidden />
                )}

              {lookupData.authorizedCaenCodes && lookupData.authorizedCaenCodes.length > 0 &&
                renderInfoPanel(
                  "CAEN autorizat",
                  <p className="text-xs leading-relaxed">
                    {lookupData.authorizedCaenCodes.slice(0, 12).join(", ")}
                    {lookupData.authorizedCaenCodes.length > 12
                      ? ` și încă ${lookupData.authorizedCaenCodes.length - 12} coduri`
                      : ""}
                  </p>
                )}
            </div>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[#9aa0a6]">{STEP_HINTS[3]}</p>
          <div className="rounded-xl border border-[#2eb8f0]/30 bg-[#2eb8f0]/10 px-4 py-3 text-sm">
            <p className="font-medium text-[#e8f6ff]">Reprezentant înregistrat</p>
            <p className="mt-1 text-[#c8e7ff]">{representativeName}</p>
            <p className="mt-2 text-xs text-[#9aa0a6]">
              Numele a fost declarat la crearea contului pe AiMeseriaș.
            </p>
          </div>

          {!nameMatchesOnrc && administrators.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <p className="font-medium">Numele nu apare în lista administratorilor ONRC</p>
                <p className="mt-1 text-amber-200/90">
                  Numele tău ({representativeName}) nu corespunde niciunuia dintre administratorii
                  înregistrați la ONRC pentru această firmă. Verifică datele sau confirmă explicit
                  că ești reprezentantul legal autorizat.
                </p>
              </div>
            </div>
          )}

          {nameMatchesOnrc && administrators.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>Numele tău apare în lista administratorilor ONRC.</p>
            </div>
          )}

          <button
            type="button"
            role="checkbox"
            aria-checked={legalRepConfirmed}
            onClick={() => {
              setLegalRepConfirmed((v) => !v);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.legal_rep;
                return next;
              });
            }}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
              legalRepConfirmed
                ? "border-[#2eb8f0] bg-[#2eb8f0]/10"
                : "border-[rgba(95,99,104,0.5)] hover:border-[#2eb8f0]/60"
            }`}
          >
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                legalRepConfirmed
                  ? "border-[#2eb8f0] bg-[#2eb8f0] text-white"
                  : "border-[#5f6368] bg-transparent"
              }`}
              aria-hidden
            >
              {legalRepConfirmed ? (
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
                  legalRepConfirmed ? "text-[#2eb8f0]" : "text-[#e8eaed]"
                }`}
              >
                Confirm că sunt reprezentantul legal al companiei
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[#9aa0a6]">
                {nameMatchesOnrc
                  ? "Confirm pe propria răspundere că am dreptul să reprezint compania în relația cu AiMeseriaș."
                  : "Confirm pe propria răspundere că sunt reprezentantul legal autorizat, deși numele meu nu apare în lista administratorilor ONRC."}
              </span>
            </span>
          </button>
          {fieldErrors.legal_rep && (
            <p className="text-[13px] text-[#ea4335]">{fieldErrors.legal_rep}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-[#9aa0a6]">{STEP_HINTS[4]}</p>
        <div className="rounded-xl border border-[rgba(95,99,104,0.35)] bg-[#1a1d24] px-4 py-3 text-sm text-[#9aa0a6]">
          <p className="font-medium text-[#e8eaed]">{form.company_name}</p>
          <p className="mt-1">CUI {form.company_cui}</p>
        </div>

        {renderDocumentUpload(
          "Certificat de înregistrare",
          "Certificatul emis de ONRC pentru înregistrarea companiei.",
          registrationInputRef,
          documents.registrationCertificate,
          existingDocuments.registrationCertificate,
          "registration_certificate",
          (file) => setDocument("registrationCertificate", file, "registration_certificate")
        )}

        {renderDocumentUpload(
          "Act de identitate al reprezentantului",
          "Copie CI/BI sau pașaport a reprezentantului legal înregistrat în cont.",
          repIdInputRef,
          documents.repId,
          existingDocuments.repId,
          "rep_id",
          (file) => setDocument("repId", file, "rep_id")
        )}

        {requiresRepAuthorization &&
          renderDocumentUpload(
            "Dovadă drept de reprezentare",
            "Document care atestă că ai dreptul să reprezinți compania (ex. împuternicire, hotărâre AGA), deoarece numele tău nu apare în lista administratorilor ONRC.",
            repAuthInputRef,
            documents.repAuthorization,
            existingDocuments.repAuthorization,
            "rep_authorization",
            (file) => setDocument("repAuthorization", file, "rep_authorization")
          )}
      </div>
    );
  };

  return (
    <AuthCard
      containerClassName="max-w-[980px]"
      rightClassName="max-w-none md:pt-[95px]"
      title={STEP_TITLES[step]}
      subtitle={`Pas ${step} din ${TOTAL_STEPS}`}
      subtitleStep={step}
      stepDirection={direction}
    >
      {status === "rejected" && rejectionReason && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <p className="font-medium">Motiv respingere</p>
          <p className="mt-1">{rejectionReason}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleNext();
        }}
        noValidate
      >
        {error && <p className="mb-3 text-left text-[13px] text-[#ea4335]">{error}</p>}

        <div key={step} className={stepAnimation}>
          {renderStepContent()}
        </div>

        <div
          className={`mt-5 flex items-center gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}
        >
          <AuthBackButton onClick={handleBack} visible={step > 1} />
          <AuthSubmitButton loading={loading}>
            {step === TOTAL_STEPS
              ? "Trimite spre verificare"
              : step === 1
                ? loading
                  ? "Se preiau datele…"
                  : "Preia datele"
                : "Înainte"}
          </AuthSubmitButton>
        </div>
      </form>
    </AuthCard>
  );
}

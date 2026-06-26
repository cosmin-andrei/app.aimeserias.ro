"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    Loader2,
    XCircle,
} from "lucide-react";
import { AuthCard } from "@/components/Auth/AuthCard";
import {
    activateCompanySubscription,
    fetchCurrentUser,
    getProfilePictureUrl,
    type AppUser,
    type CompanyVerificationPayload,
} from "@/lib/api-client";
import {
    COMPANY_STATUS_LABELS,
    type CompanyStatus,
} from "@/lib/company-account";
import subscriptions from "@/data/subscriptions.json";
import { useUser } from "@/hooks/useUser";
import { CompanyOnboardingWizard } from "./CompanyOnboardingWizard";

const EMPTY_FORM: CompanyVerificationPayload = {
    company_name: "",
    company_cui: "",
    company_reg_com: "",
    company_legal_form: "SRL",
    company_address: "",
};

export default function CompanyOnboardingPage() {
    const { refetch } = useUser();
    const [profile, setProfile] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialForm, setInitialForm] = useState<CompanyVerificationPayload>(EMPTY_FORM);

    const firmaPlan = subscriptions.plans.find((plan) => plan.id === "firma");

    const load = async () => {
        setLoading(true);
        const user = await fetchCurrentUser();
        setProfile(user);
        if (user) {
            setInitialForm({
                company_name: user.company_name || "",
                company_cui: user.company_cui || "",
                company_reg_com: user.company_reg_com || "",
                company_legal_form: user.company_legal_form || "SRL",
                company_address: user.company_address || "",
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        void load();
    }, []);

    const status = (profile?.company_status || "onboarding") as CompanyStatus;
    const canSubmit = status === "onboarding" || status === "rejected";

    const handleActivateSubscription = async () => {
        setPaying(true);
        setError(null);
        const result = await activateCompanySubscription();
        setPaying(false);

        if (!result.success || !result.user) {
            setError(result.error || "Activarea abonamentului a eșuat.");
            return;
        }

        setProfile(result.user);
        await refetch();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0f1115]">
                <Loader2 className="size-8 animate-spin text-[#2eb8f0]" aria-hidden />
            </div>
        );
    }

    if (!profile?.is_company_account) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4">
                <AuthCard title="Acces restricționat" subtitle="Această pagină este doar pentru conturi de companie.">
                    <Link href="/" className="text-sm text-[#2eb8f0] hover:underline">
                        Înapoi la dashboard
                    </Link>
                </AuthCard>
            </div>
        );
    }

    if (canSubmit) {
        const existingDocuments = {
            registrationCertificate: profile.company_registration_certificate
                ? getProfilePictureUrl(profile.company_registration_certificate)
                : profile.company_document
                  ? getProfilePictureUrl(profile.company_document)
                  : null,
            repId: profile.company_rep_id_document
                ? getProfilePictureUrl(profile.company_rep_id_document)
                : null,
            repAuthorization: profile.company_rep_authorization_document
                ? getProfilePictureUrl(profile.company_rep_authorization_document)
                : null,
        };

        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4 py-10">
                <div className="w-full max-w-[980px]">
                    <CompanyOnboardingWizard
                        profile={profile}
                        initialForm={initialForm}
                        existingDocuments={existingDocuments}
                        status={status}
                        rejectionReason={profile.company_rejection_reason}
                        onSubmitted={async (user) => {
                            setProfile(user);
                            await refetch();
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4 py-10">
            <div className="w-full max-w-[980px]">
                <AuthCard
                    containerClassName="max-w-[980px]"
                    rightClassName="max-w-none md:pt-[95px]"
                    title={
                        <>
                            Verificare cont
                            <br />
                            companie
                        </>
                    }
                    subtitle="Contul de companie se activează după verificarea documentelor și plata abonamentului."
                >
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#2eb8f0]/30 bg-[#2eb8f0]/10 px-4 py-3 text-sm text-[#c8e7ff]">
                        <Building2 className="mt-0.5 size-5 shrink-0 text-[#2eb8f0]" aria-hidden />
                        <div>
                            <p className="font-medium text-[#e8f6ff]">
                                Reprezentant legal: {profile.first_name} {profile.last_name}
                            </p>
                            <p className="mt-1 text-[#9aa0a6]">
                                {profile.legal_representative_declared_at
                                    ? "Identitatea reprezentantului legal a fost declarată la înregistrare."
                                    : "Cont înregistrat ca companie."}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-stroke/40 bg-[#1a1d24] px-4 py-3 text-sm">
                        {status === "pending_review" && (
                            <Clock className="size-5 shrink-0 text-amber-400" aria-hidden />
                        )}
                        {status === "rejected" && (
                            <XCircle className="size-5 shrink-0 text-rose-400" aria-hidden />
                        )}
                        {status === "pending_payment" && (
                            <CreditCard className="size-5 shrink-0 text-emerald-400" aria-hidden />
                        )}
                        {status === "active" && (
                            <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden />
                        )}
                        <span className="text-[#e8eaed]">{COMPANY_STATUS_LABELS[status]}</span>
                    </div>

                    {error && <p className="mb-4 text-sm text-[#ea4335]">{error}</p>}

                    {status === "pending_review" && (
                        <p className="text-sm leading-relaxed text-[#9aa0a6]">
                            Datele și documentele companiei au fost trimise. Un administrator le va
                            analiza în curând. Vei putea continua cu plata abonamentului după
                            aprobare.
                        </p>
                    )}

                    {status === "pending_payment" && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
                                <p className="text-sm font-medium text-emerald-100">
                                    Compania ta a fost aprobată
                                </p>
                                <p className="mt-1 text-sm text-emerald-200/80">
                                    Pentru activarea contului este necesar abonamentul Firmă.
                                </p>
                            </div>
                            {firmaPlan && (
                                <div className="rounded-xl border border-stroke/40 bg-[#1a1d24] p-4">
                                    <p className="text-base font-semibold text-[#e8eaed]">
                                        {firmaPlan.name}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-[#2eb8f0]">
                                        {firmaPlan.price}
                                        <span className="text-sm font-normal text-[#9aa0a6]">
                                            {firmaPlan.period}
                                        </span>
                                    </p>
                                    <p className="mt-2 text-sm text-[#9aa0a6]">{firmaPlan.description}</p>
                                </div>
                            )}
                            <p className="text-xs text-[#9aa0a6]">
                                Plata online va fi disponibilă în curând. Până atunci, confirmarea
                                de mai jos activează abonamentul Firmă în contul tău după aprobarea
                                administratorului.
                            </p>
                            <button
                                type="button"
                                disabled={paying}
                                onClick={() => void handleActivateSubscription()}
                                className="w-full rounded-lg bg-[#1a4d78] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#143f63] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {paying ? "Se activează…" : "Activează abonamentul Firmă"}
                            </button>
                        </div>
                    )}

                    {status === "active" && (
                        <div className="space-y-4 text-center">
                            <CheckCircle2 className="mx-auto size-12 text-emerald-400" aria-hidden />
                            <p className="text-sm text-[#9aa0a6]">
                                Contul companiei este activ. Poți folosi toate funcționalitățile
                                platformei.
                            </p>
                            <Link
                                href="/"
                                className="inline-flex rounded-xl bg-[#16366d] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                            >
                                Mergi la dashboard
                            </Link>
                        </div>
                    )}
                </AuthCard>
            </div>
        </div>
    );
}

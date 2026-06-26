"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  getProfilePictureUrl,
  type AppUser,
} from "@/lib/api-client";
import {
  COMPANY_STATUS_LABELS,
  getCompanyOnboardingPath,
  type CompanyStatus,
} from "@/lib/company-account";
import { useUser } from "@/hooks/useUser";

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stroke bg-gray-2/80 py-3 px-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <p className="text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">{label}</p>
      <p className="mt-0.5 font-medium text-dark dark:text-white">{value || "—"}</p>
    </div>
  );
}

function DocumentField({
  label,
  filename,
}: {
  label: string;
  filename: string | null | undefined;
}) {
  const url = filename ? getProfilePictureUrl(filename) : null;

  return (
    <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <p className="text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#16366d] hover:underline dark:text-blue-400"
        >
          <FileText className="size-4 shrink-0" aria-hidden />
          Vezi documentul
          <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </a>
      ) : (
        <p className="mt-1 text-sm text-dark-5 dark:text-[#9CA3AF]">Nu este încărcat</p>
      )}
    </div>
  );
}

function StatusBanner({ status, rejectionReason }: { status: CompanyStatus; rejectionReason?: string | null }) {
  if (status === "pending_review") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>Datele companiei sunt în verificare de către administrator.</p>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-100">
        <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">Verificare respinsă</p>
          {rejectionReason && <p className="mt-1">{rejectionReason}</p>}
        </div>
      </div>
    );
  }
  if (status === "pending_payment") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>Compania a fost aprobată. Activează abonamentul pentru a folosi platforma.</p>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>Contul companiei este activ.</p>
      </div>
    );
  }
  return null;
}

export function CompanyInfoSection() {
  const { user: contextUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AppUser | null>(null);

  useEffect(() => {
    void fetchCurrentUser().then((user) => {
      setProfile(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-sm text-dark-5 dark:text-[#9CA3AF]">
        Se încarcă informațiile companiei…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-sm text-dark-5 dark:text-[#9CA3AF]">
        Nu s-au putut încărca datele companiei.
      </div>
    );
  }

  const status = (profile.company_status || "onboarding") as CompanyStatus;
  const canEdit = status === "onboarding" || status === "rejected";
  const representativeName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  const registrationCert =
    profile.company_registration_certificate || profile.company_document;

  return (
    <div className="grid gap-8 p-6 md:grid-cols-[280px_1fr]">
      <div className="flex flex-col items-center rounded-xl border border-stroke bg-gray-2/50 p-6 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <span className="flex size-24 items-center justify-center rounded-full bg-[#16366d]/10 text-[#16366d] dark:bg-[#2eb8f0]/15 dark:text-[#5b9fff]">
          <Building2 className="size-10" strokeWidth={1.5} aria-hidden />
        </span>
        <p className="mt-3 text-center font-semibold text-dark dark:text-white">
          {profile.company_name?.trim() || "Companie"}
        </p>
        <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
          {profile.company_cui ? `CUI ${profile.company_cui}` : "—"}
        </p>
        <p className="mt-2 text-center text-xs font-medium text-[#16366d] dark:text-[#5b9fff]">
          {COMPANY_STATUS_LABELS[status]}
        </p>
        {canEdit && (
          <Link
            href={getCompanyOnboardingPath()}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
          >
            {status === "rejected" ? "Corectează datele" : "Completează verificarea"}
          </Link>
        )}
      </div>

      <div className="space-y-6">
        <StatusBanner status={status} rejectionReason={profile.company_rejection_reason} />

        <div className="space-y-3">
          <InfoField label="Denumire companie" value={profile.company_name || ""} />
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoField label="CUI" value={profile.company_cui || ""} />
            <InfoField label="Nr. Reg. Comerțului" value={profile.company_reg_com || ""} />
          </div>
          <InfoField label="Formă juridică" value={profile.company_legal_form || ""} />
          <InfoField label="Sediu social" value={profile.company_address || ""} />
        </div>

        <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <p className="mb-3 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
            Reprezentant legal
          </p>
          <p className="text-sm font-medium text-dark dark:text-white">
            {representativeName || contextUser?.name || "—"}
          </p>
          {profile.legal_representative_declared_at && (
            <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
              Declarat la înregistrare
              {formatDate(profile.legal_representative_declared_at)
                ? ` · ${formatDate(profile.legal_representative_declared_at)}`
                : ""}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <p className="mb-3 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
            Documente
          </p>
          <div className="space-y-3">
            <DocumentField label="Certificat de înregistrare" filename={registrationCert} />
            <DocumentField label="Act de identitate reprezentant" filename={profile.company_rep_id_document} />
            <DocumentField
              label="Dovadă drept de reprezentare"
              filename={profile.company_rep_authorization_document}
            />
          </div>
        </div>

        {(profile.company_submitted_at || profile.company_approved_at) && (
          <div className="rounded-xl border border-stroke/60 bg-white/50 px-4 py-3 text-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
            {profile.company_submitted_at && (
              <p className="text-dark-5 dark:text-[#9CA3AF]">
                <span className="font-medium text-dark dark:text-white">Trimis spre verificare: </span>
                {formatDate(profile.company_submitted_at)}
              </p>
            )}
            {profile.company_approved_at && (
              <p className={`text-dark-5 dark:text-[#9CA3AF] ${profile.company_submitted_at ? "mt-1" : ""}`}>
                <span className="font-medium text-dark dark:text-white">Aprobat: </span>
                {formatDate(profile.company_approved_at)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

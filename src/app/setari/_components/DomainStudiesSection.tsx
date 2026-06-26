"use client";

import { SpecializationPicker } from "@/app/setari/_components/SpecializationPicker";
import { CheckCircle2, Clock, GraduationCap, Upload, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  fetchCurrentUser,
  getProfilePictureUrl,
  uploadDomainStudies,
  type AppUser,
} from "@/lib/api-client";

function formatSubmittedAt(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DomainStudiesSection() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const user = await fetchCurrentUser();
    setProfile(user);
    if (user?.domain_studies_specializations?.length) {
      setSelectedSpecializations(user.domain_studies_specializations);
    } else if (user?.studies_verified_specializations?.length) {
      setSelectedSpecializations(user.studies_verified_specializations);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const status = profile?.domain_studies_status ?? null;
  const rejectionReason = profile?.domain_studies_rejection_reason ?? null;
  const submittedAt = formatSubmittedAt(profile?.domain_studies_submitted_at);
  const documentUrl = profile?.domain_studies_document
    ? getProfilePictureUrl(profile.domain_studies_document)
    : null;
  const verifiedSpecializations = profile?.studies_verified_specializations ?? [];
  const pendingSpecializations = profile?.domain_studies_specializations ?? [];

  const canUpload = !status || status === "rejected";

  const submitUpload = async (file: File) => {
    if (selectedSpecializations.length === 0) {
      addToast("error", "Selectează cel puțin o specializare pentru document.");
      return;
    }

    setUploading(true);
    const { success, user, error } = await uploadDomainStudies(file, selectedSpecializations);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!success || !user) {
      addToast("error", error || "Nu am putut încărca documentul.");
      return;
    }

    setProfile(user);
    addToast("success", "Document trimis spre verificare.");
  };

  const handleUploadClick = () => {
    if (selectedSpecializations.length === 0) {
      addToast("error", "Selectează mai întâi specializările acoperite de document.");
      return;
    }
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă studiile în domeniu…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
            <p className="text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
              Studii în domeniu
            </p>
          </div>
          <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
            Încarcă o diplomă, certificat sau alt document oficial și asociază-l cu specializările
            pe care le acoperă. După aprobare, aceste specializări apar evidențiate în profilul public
            și nu le poți elimina.
          </p>
        </div>
        {canUpload && (
          <>
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
            >
              <Upload className="size-4" />
              {uploading ? "Se încarcă…" : status === "rejected" ? "Încarcă din nou" : "Încarcă document"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void submitUpload(file);
              }}
            />
          </>
        )}
      </div>

      {canUpload && (
        <div className="mt-4 rounded-lg border border-stroke/60 bg-white/50 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="mb-3 text-xs font-medium text-dark dark:text-white">
            Specializări acoperite de document
          </p>
          <SpecializationPicker
            value={selectedSpecializations}
            onChange={setSelectedSpecializations}
            lockedItems={verifiedSpecializations}
          />
        </div>
      )}

      <div className="mt-3 rounded-lg border border-stroke/60 bg-white/50 px-3 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
        {!status && (
          <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
            Niciun document încărcat.
          </p>
        )}

        {status === "pending" && (
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark dark:text-white">În curs de verificare</p>
              <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                Documentul a fost trimis spre aprobare
                {submittedAt ? ` pe ${submittedAt}` : ""}. Vei fi notificat după verificare.
              </p>
              {pendingSpecializations.length > 0 && (
                <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                  <span className="font-medium text-dark dark:text-white">Specializări solicitate: </span>
                  {pendingSpecializations.join(", ")}
                </p>
              )}
              {documentUrl && (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Vezi documentul încărcat
                </a>
              )}
            </div>
          </div>
        )}

        {status === "approved" && (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark dark:text-white">Aprobat</p>
              <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                Specializările verificate sunt evidențiate în profilul public.
              </p>
              {verifiedSpecializations.length > 0 && (
                <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                  <span className="font-medium text-dark dark:text-white">Specializări verificate: </span>
                  {verifiedSpecializations.join(", ")}
                </p>
              )}
            </div>
          </div>
        )}

        {status === "rejected" && (
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 size-4 shrink-0 text-red dark:text-red-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark dark:text-white">Respins</p>
              {rejectionReason && (
                <p className="mt-1 text-sm text-dark dark:text-white">
                  <span className="text-dark-5 dark:text-[#9CA3AF]">Motiv: </span>
                  {rejectionReason}
                </p>
              )}
              <p className="mt-1.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                Poți selecta din nou specializările și încărca un document nou pentru verificare.
              </p>
            </div>
          </div>
        )}
      </div>

      {canUpload && (
        <p className="mt-2 text-xs text-dark-5 dark:text-[#9CA3AF]">
          PDF, JPG, PNG sau WebP. Max 10 MB.
        </p>
      )}
    </div>
  );
}

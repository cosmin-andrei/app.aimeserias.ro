"use client";

import { Briefcase, CheckCircle2, Clock, Pencil, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  fetchCurrentUser,
  getProfilePictureUrl,
  submitPfa,
  type AppUser,
  type PfaPayload,
} from "@/lib/api-client";
import { PFA_TYPE_LABEL } from "@/lib/meserias";

const INPUT_CLASS =
  "w-full rounded-xl border border-stroke bg-white px-3.5 py-2.5 text-sm text-dark shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-white/[0.14] dark:bg-[#141414] dark:text-white";

function formatSubmittedAt(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const EMPTY_FORM: PfaPayload = {
  pfa_name: "",
  pfa_cui: "",
  pfa_registration_number: "",
  pfa_address: "",
};

export function PfaSection() {
  const { addToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [form, setForm] = useState<PfaPayload>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const user = await fetchCurrentUser();
    setProfile(user);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const status = profile?.pfa_status ?? null;
  const hasPfaData = Boolean(profile?.pfa_name);
  const canEdit = status !== "pending";
  const submittedAt = formatSubmittedAt(profile?.pfa_submitted_at);
  const documentUrl = profile?.pfa_document
    ? getProfilePictureUrl(profile.pfa_document)
    : null;

  const openModal = () => {
    setForm({
      pfa_name: profile?.pfa_name ?? "",
      pfa_cui: profile?.pfa_cui ?? "",
      pfa_registration_number: profile?.pfa_registration_number ?? "",
      pfa_address: profile?.pfa_address ?? "",
    });
    setSelectedFile(null);
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    dialogRef.current?.close();
    setModalOpen(false);
    setError(null);
    setSelectedFile(null);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const id = requestAnimationFrame(() => {
      dialogRef.current?.showModal();
    });
    return () => cancelAnimationFrame(id);
  }, [modalOpen]);

  const handleSubmit = async () => {
    if (!form.pfa_name.trim() || !form.pfa_cui.trim() || !form.pfa_registration_number.trim() || !form.pfa_address.trim()) {
      setError("Completează toate câmpurile obligatorii.");
      return;
    }
    if (!selectedFile && !profile?.pfa_document) {
      setError("Încarcă documentul doveditor.");
      return;
    }

    setSaving(true);
    const { success, user, error: submitError } = await submitPfa(form, selectedFile);
    setSaving(false);

    if (!success || !user) {
      setError(submitError || "Nu am putut trimite datele PFA.");
      addToast("error", submitError || "Nu am putut trimite datele PFA.");
      return;
    }

    setProfile(user);
    closeModal();
    addToast("success", "Datele PFA au fost trimise spre verificare.");
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă datele PFA…</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
              <p className="text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Persoană fizică autorizată
              </p>
            </div>
            <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
              Poți înregistra o singură PFA. Completează datele firmei și încarcă documente
              doveditoare. După aprobare, în profilul public vei apărea ca {PFA_TYPE_LABEL}.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openModal}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
            >
              <Pencil className="size-4" />
              {hasPfaData ? "Modifică PFA" : "Adaugă PFA"}
            </button>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-stroke/60 bg-white/50 px-3 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          {!hasPfaData && !status && (
            <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Nicio PFA înregistrată.</p>
          )}

          {hasPfaData && (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-dark-5 dark:text-[#9CA3AF]">Denumire</dt>
                <dd className="font-medium text-dark dark:text-white">{profile?.pfa_name}</dd>
              </div>
              <div>
                <dt className="text-dark-5 dark:text-[#9CA3AF]">CUI</dt>
                <dd className="font-medium text-dark dark:text-white">{profile?.pfa_cui}</dd>
              </div>
              <div>
                <dt className="text-dark-5 dark:text-[#9CA3AF]">Nr. înregistrare</dt>
                <dd className="font-medium text-dark dark:text-white">
                  {profile?.pfa_registration_number}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-dark-5 dark:text-[#9CA3AF]">Sediu social</dt>
                <dd className="font-medium text-dark dark:text-white">{profile?.pfa_address}</dd>
              </div>
            </dl>
          )}

          {status === "pending" && (
            <div className="mt-3 flex items-start gap-2 border-t border-stroke/60 pt-3 dark:border-white/[0.06]">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-dark dark:text-white">În curs de verificare</p>
                <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Trimis spre aprobare{submittedAt ? ` pe ${submittedAt}` : ""}.
                </p>
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
            <div className="mt-3 flex items-start gap-2 border-t border-stroke/60 pt-3 dark:border-white/[0.06]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                PFA aprobată. În profilul public ești afișat ca {PFA_TYPE_LABEL}.
              </p>
            </div>
          )}

          {status === "rejected" && (
            <div className="mt-3 flex items-start gap-2 border-t border-stroke/60 pt-3 dark:border-white/[0.06]">
              <XCircle className="mt-0.5 size-4 shrink-0 text-red dark:text-red-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-dark dark:text-white">Respins</p>
                {profile?.pfa_rejection_reason && (
                  <p className="mt-1 text-sm text-dark dark:text-white">
                    <span className="text-dark-5 dark:text-[#9CA3AF]">Motiv: </span>
                    {profile.pfa_rejection_reason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-0 flex min-h-[100dvh] w-full items-center justify-center border-0 bg-transparent p-4 outline-none [&::backdrop]:bg-black/50 [&::backdrop]:backdrop-blur-md"
        onCancel={(e) => {
          e.preventDefault();
          closeModal();
        }}
        onClose={() => {
          setModalOpen(false);
          setError(null);
          setSelectedFile(null);
        }}
      >
        <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-dark dark:text-white">
              {hasPfaData ? "Modifică PFA" : "Adaugă PFA"}
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg p-1.5 text-dark-5 hover:bg-gray-2 dark:hover:bg-white/[0.08]"
              aria-label="Închide"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {error && (
              <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red dark:bg-red/20 dark:text-red-400">
                {error}
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Denumire PFA
              </label>
              <input
                type="text"
                value={form.pfa_name}
                onChange={(e) => setForm((f) => ({ ...f, pfa_name: e.target.value }))}
                placeholder="Ex: POPESCU ION PFA"
                className={INPUT_CLASS}
                maxLength={150}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                  CUI
                </label>
                <input
                  type="text"
                  value={form.pfa_cui}
                  onChange={(e) => setForm((f) => ({ ...f, pfa_cui: e.target.value }))}
                  placeholder="Ex: 12345678"
                  className={INPUT_CLASS}
                  maxLength={20}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Nr. înregistrare ONRC
                </label>
                <input
                  type="text"
                  value={form.pfa_registration_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pfa_registration_number: e.target.value }))
                  }
                  placeholder="Ex: J40/1234/2020"
                  className={INPUT_CLASS}
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Sediu social
              </label>
              <input
                type="text"
                value={form.pfa_address}
                onChange={(e) => setForm((f) => ({ ...f, pfa_address: e.target.value }))}
                placeholder="Adresa completă a sediului social"
                className={INPUT_CLASS}
                maxLength={255}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Document doveditor
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-dark-5 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary dark:text-[#9CA3AF]"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1.5 text-xs text-dark-5 dark:text-[#9CA3AF]">
                Certificat înregistrare, decizie ANAF sau alt document oficial. PDF, JPG, PNG sau
                WebP, max 10 MB.
                {profile?.pfa_document && !selectedFile
                  ? " La modificare poți păstra documentul existent sau încărca unul nou."
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Se trimite…" : "Trimite spre verificare"}
            </button>
          </div>
        </div>
      </dialog>
      )}
    </>
  );
}

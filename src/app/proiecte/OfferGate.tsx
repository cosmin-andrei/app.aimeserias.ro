"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOffer } from "@/lib/api-client";
import { FileText, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { OpenChatLink } from "@/components/messaging/OpenChatLink";
import { useUser } from "@/hooks/useUser";
import { normalizeUserRole } from "@/lib/site";

type OfferGateProps = {
  projectTitle: string;
  clientName: string;
  clientUserId?: number;
  jobId?: number;
};

export function OfferGate({ projectTitle, clientName, clientUserId, jobId }: OfferGateProps) {
  const router = useRouter();
  const { user } = useUser();
  const role = normalizeUserRole(user?.role);
  const [showForm, setShowForm] = useState(false);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmitOffer = async () => {
    if (!jobId) return;
    const parsedPrice = Number(price.replace(",", "."));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Introdu un preț valid.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const parsedDays = estimatedDays.trim() ? Number(estimatedDays) : null;
    const { success: ok, error: submitError } = await createOffer({
      job_id: jobId,
      price: parsedPrice,
      message: message.trim() || undefined,
      estimated_days:
        parsedDays != null && Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : null,
    });

    setSubmitting(false);

    if (!ok) {
      setError(submitError ?? "Nu am putut trimite oferta.");
      return;
    }

    setSuccess(true);
    setShowForm(false);
    router.refresh();
  };

  if (role === "worker") {
    return (
      <aside
        className="rounded-2xl border border-[#002050]/10 bg-gradient-to-br from-[#fafcff] to-white p-6 shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:from-[#141414] dark:to-[#101012] dark:ring-white/[0.06]"
        aria-label="Depune ofertă"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0060f0]/15 text-[#0060f0] dark:bg-[#5b9fff]/15 dark:text-[#5b9fff]">
            <Send className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Depune o ofertă</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
              Poți trimite o ofertă pentru „{projectTitle}”. Clientul{" "}
              <span className="font-medium text-gray-900 dark:text-white">{clientName}</span> va fi
              notificat.
            </p>

            {success ? (
              <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Oferta a fost trimisă cu succes.
              </p>
            ) : showForm ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-[#9CA3AF]">
                    Preț (RON)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.12] dark:bg-[#0f0f11] dark:text-white"
                    placeholder="ex. 2500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-[#9CA3AF]">
                    Durată estimată (zile)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.12] dark:bg-[#0f0f11] dark:text-white"
                    placeholder="opțional"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-[#9CA3AF]">
                    Mesaj
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.12] dark:bg-[#0f0f11] dark:text-white"
                    placeholder="Detalii despre ofertă..."
                  />
                </div>
                {error && <p className="text-sm text-red dark:text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium dark:border-white/[0.12]"
                  >
                    Anulează
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitOffer}
                    disabled={submitting || !jobId}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#002050] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#f1f6ff] dark:text-[#08080a]"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    {submitting ? "Se trimite..." : "Trimite oferta"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                disabled={!jobId}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#002050] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#f1f6ff] dark:text-[#08080a]"
              >
                <FileText className="h-4 w-4" aria-hidden />
                Trimite ofertă
              </button>
            )}
          </div>
        </div>
        <div className="mt-5 space-y-3 border-t border-[#002050]/8 pt-5 dark:border-white/[0.08]">
          {clientUserId ? (
            <OpenChatLink
              otherUserId={clientUserId}
              jobId={jobId}
              variant="subtle"
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
              <span className="text-sm text-gray-700 dark:text-[#E5E7EB]">Chat cu clientul</span>
            </OpenChatLink>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-[#002050]/8 dark:bg-white/[0.04] dark:ring-white/[0.08]">
              <MessageCircle className="h-4 w-4 shrink-0 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
              <span className="text-sm text-gray-700 dark:text-[#E5E7EB]">Chat cu clientul</span>
            </div>
          )}
        </div>
      </aside>
    );
  }

  if (role === "client") {
    return (
      <aside className="rounded-2xl border border-[#002050]/10 bg-white p-6 shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:bg-[#141414] dark:ring-white/[0.06]">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Ofertele primite</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-[#9CA3AF]">
          Meseriașii pot depune oferte la acest proiect. Vei primi notificări când apar oferte noi.
        </p>
        <p className="mt-4 text-xs text-gray-500 dark:text-[#6B7280]">
          Gestionează proiectele din{" "}
          <Link
            href="/proiecte?view=mine"
            className="text-[#0060f0] hover:underline dark:text-[#5b9fff]"
          >
            Proiectele mele
          </Link>
          .
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-[#002050]/10 bg-gradient-to-br from-[#fafcff] to-white p-6 shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:from-[#141414] dark:to-[#101012] dark:ring-white/[0.06]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0060f0]/15 text-[#0060f0] dark:bg-[#5b9fff]/15 dark:text-[#5b9fff]">
          <Send className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Depune o ofertă</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-[#9CA3AF]">
            Autentifică-te ca meseriaș pentru a trimite o ofertă la acest proiect.
          </p>
          <Link
            href="/auth/sign-in"
            className="mt-4 inline-flex rounded-xl bg-[#002050] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#001040] dark:bg-[#f1f6ff] dark:text-[#08080a] dark:hover:bg-white"
          >
            Autentificare
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default OfferGate;

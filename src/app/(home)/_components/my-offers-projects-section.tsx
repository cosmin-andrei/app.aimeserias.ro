"use client";

import { getMyOffers, type MyOfferItem, type OfferStatus } from "@/lib/api-client";
import { ArrowRight, MapPin, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: "În așteptare",
  accepted: "Acceptată",
  rejected: "Respinsă",
};

const OFFER_STATUS_STYLES: Record<OfferStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  rejected: "bg-gray-100 text-gray-600 ring-gray-200/70 dark:bg-white/10 dark:text-[#9CA3AF] dark:ring-white/10",
};

const MAX_ITEMS = 5;

function formatOfferDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(value: number | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("ro-RO")} RON`;
}

function OfferRow({ offer }: { offer: MyOfferItem }) {
  const title = offer.job?.title ?? `Proiect #${offer.job_id}`;
  const city = offer.job?.city;

  return (
    <Link
      href="/proiecte?view=offered"
      className="group flex flex-col gap-3 rounded-xl border border-transparent bg-white p-4 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#16366d]/10 hover:shadow-md hover:ring-[#16366d]/15 dark:bg-[#141414] dark:ring-white/[0.06] dark:hover:ring-[#f1f6ff]/20 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-dark transition-colors group-hover:text-[#16366d] dark:text-white dark:group-hover:text-[#f1f6ff]">
          {title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
          {city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              {city}
            </span>
          )}
          <span>Ofertă: {formatPrice(offer.price)}</span>
          <span>Trimisă {formatOfferDate(offer.created_at)}</span>
        </div>
      </div>
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${OFFER_STATUS_STYLES[offer.status]}`}
      >
        {OFFER_STATUS_LABELS[offer.status]}
      </span>
    </Link>
  );
}

export function MyOffersProjectsSection() {
  const [offers, setOffers] = useState<MyOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data, error: fetchError } = await getMyOffers();
      if (cancelled) return;
      setOffers(data ?? []);
      setError(fetchError ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleOffers = offers.slice(0, MAX_ITEMS);

  return (
    <section className="rounded-2xl bg-white/60 p-6 ring-1 ring-black/[0.04] dark:bg-white/[0.02] dark:ring-white/[0.06] sm:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
          <Send className="size-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-dark dark:text-white">
            Proiecte cu ofertă trimisă
          </h2>
          <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
            Ultimele oferte pe care le-ai trimis
          </p>
        </div>
        <Link
          href="/proiecte?view=offered"
          className="inline-flex items-center gap-1.5 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-[#16366d] shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-[#f1f6ff] dark:hover:bg-white/[0.12]"
        >
          Vezi toate
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-stroke/60 bg-white/50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">{error}</p>
        </div>
      ) : visibleOffers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stroke/60 bg-white/50 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <Send className="mx-auto size-10 text-dark-5/50 dark:text-[#9CA3AF]/50" strokeWidth={1} />
          <p className="mt-3 text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
            Nicio ofertă trimisă încă
          </p>
          <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
            Explorează proiectele disponibile și trimite prima ta ofertă
          </p>
          <Link
            href="/proiecte?view=offered"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#16366d] hover:underline dark:text-[#f1f6ff]"
          >
            Vezi proiecte
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOffers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </section>
  );
}

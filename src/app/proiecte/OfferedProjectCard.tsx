import Link from "next/link";
import { Briefcase, Calendar, MapPin, Send } from "lucide-react";
import type { MyOfferItem, OfferStatus } from "@/lib/api-client";

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
    pending: "În așteptare",
    accepted: "Acceptată",
    rejected: "Respinsă",
};

const OFFER_STATUS_STYLES: Record<OfferStatus, string> = {
    pending:
        "bg-amber-400/15 text-amber-700 ring-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    accepted:
        "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    rejected:
        "bg-gray-100 text-gray-600 ring-gray-200/70 dark:bg-white/10 dark:text-[#9CA3AF] dark:ring-white/10",
};

function formatPrice(value: number | null): string {
    if (value == null) return "Preț la cerere";
    return `${value.toLocaleString("ro-RO")} RON`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

type OfferedProjectCardProps = {
    offer: MyOfferItem;
};

export function OfferedProjectCard({ offer }: OfferedProjectCardProps) {
    const title = offer.job?.title ?? `Proiect #${offer.job_id}`;
    const city = offer.job?.city;
    const category = offer.job?.category;

    return (
        <Link
            href={offer.job_id ? `/proiecte/${offer.job_id}` : "/proiecte?view=offered"}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[#16366d]/15 dark:bg-[#141414] dark:ring-white/[0.06] dark:hover:ring-[#f1f6ff]/20"
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                    <Send className="size-4" aria-hidden />
                </div>
                <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${OFFER_STATUS_STYLES[offer.status]}`}
                >
                    {OFFER_STATUS_LABELS[offer.status]}
                </span>
            </div>

            {category && (
                <span className="mb-2 inline-flex w-fit rounded-full bg-[#0060f0]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#0060f0] dark:bg-white/[0.08] dark:text-[#c5d4f5]">
                    {category}
                </span>
            )}

            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-dark transition-colors group-hover:text-[#16366d] dark:text-white dark:group-hover:text-[#f1f6ff]">
                {title}
            </h3>

            <div className="mt-4 space-y-2 border-t border-stroke/60 pt-3 dark:border-white/[0.08]">
                {city && (
                    <p className="flex items-center gap-1.5 text-xs text-dark-5 dark:text-[#9CA3AF]">
                        <MapPin className="size-3.5 shrink-0 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                        {city}
                    </p>
                )}
                <p className="flex items-center gap-1.5 text-sm font-bold text-[#16366d] dark:text-[#f1f6ff]">
                    <Briefcase className="size-3.5 shrink-0" aria-hidden />
                    Oferta ta: {formatPrice(offer.price)}
                </p>
                <p className="flex items-center gap-1.5 text-[10px] text-dark-5 dark:text-[#9CA3AF]">
                    <Calendar className="size-3 shrink-0" aria-hidden />
                    Trimisă {formatDate(offer.created_at)}
                </p>
            </div>
        </Link>
    );
}

export default OfferedProjectCard;

"use client";

import { formatReviewDate } from "@/lib/meseriasProfile";
import {
    filterAndSortMeseriasReviews,
    type MeseriasReviewSortOption,
} from "@/lib/meseriasReviews";
import type { MeseriasReview } from "@/types/meseriasProfile";
import { Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

type MeseriasReviewsPopupProps = {
    open: boolean;
    closing: boolean;
    entered: boolean;
    onClose: () => void;
    meseriasName: string;
    rating: number;
    reviewCount: number;
    reviews: MeseriasReview[];
};

function StarRating({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`${rating} din 5 stele`}>
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`size-3.5 ${
                        i < rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300 dark:text-white/20"
                    }`}
                    aria-hidden
                />
            ))}
        </span>
    );
}

export function MeseriasReviewsPopup({
    open,
    closing,
    entered,
    onClose,
    meseriasName,
    rating,
    reviewCount,
    reviews,
}: MeseriasReviewsPopupProps) {
    const [ratingFilter, setRatingFilter] = useState("all");
    const [sortBy, setSortBy] = useState<MeseriasReviewSortOption>("newest");

    const filteredReviews = useMemo(
        () => filterAndSortMeseriasReviews(reviews, ratingFilter, sortBy),
        [reviews, ratingFilter, sortBy]
    );

    if (!open || typeof document === "undefined") return null;

    const displayTotal = reviewCount > 0 ? reviewCount : reviews.length;
    const displayRating = rating > 0 ? rating : reviews.length > 0
        ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
        : 0;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[110] bg-black/50 backdrop-blur-md ${
                    closing ? "animate-backdrop-exit" : entered ? "animate-backdrop-enter" : "opacity-0"
                }`}
                aria-hidden
                onClick={onClose}
            />
            <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="meserias-recenzii-title"
                    className={`pointer-events-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1A1A1A] dark:ring-1 dark:ring-white/[0.08] ${
                        closing
                            ? "animate-modal-exit"
                            : entered
                              ? "animate-modal-enter"
                              : "pointer-events-none opacity-0"
                    }`}
                >
                    <div className="flex items-center justify-between gap-3 border-b border-stroke/80 px-5 py-4 dark:border-white/[0.08]">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green/15 dark:bg-green/20">
                                <Star size={22} strokeWidth={2} className="fill-amber-400 text-amber-400" />
                            </span>
                            <div className="min-w-0">
                                <h2
                                    id="meserias-recenzii-title"
                                    className="truncate text-lg font-semibold tracking-tight text-dark dark:text-white"
                                >
                                    Recenzii · {meseriasName}
                                </h2>
                                <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
                                    {displayTotal > 0
                                        ? `Rating mediu ${displayRating.toFixed(1)} · ${displayTotal} ${
                                              displayTotal === 1 ? "recenzie" : "recenzii"
                                          }`
                                        : "Nicio recenzie încă"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label="Închide"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-stroke/80 px-5 py-3 dark:border-white/[0.08]">
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="rounded-lg border border-stroke bg-white px-2.5 py-1.5 text-xs font-medium text-dark dark:border-white/[0.12] dark:bg-[#141414] dark:text-white"
                            aria-label="Filtrează după rating"
                        >
                            <option value="all">Toate ratingurile</option>
                            <option value="5">5 stele</option>
                            <option value="4">4 stele</option>
                            <option value="3">3 stele</option>
                            <option value="2">2 stele</option>
                            <option value="1">1 stea</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as MeseriasReviewSortOption)}
                            className="rounded-lg border border-stroke bg-white px-2.5 py-1.5 text-xs font-medium text-dark dark:border-white/[0.12] dark:bg-[#141414] dark:text-white"
                            aria-label="Sortează recenziile"
                        >
                            <option value="newest">Cele mai noi</option>
                            <option value="oldest">Cele mai vechi</option>
                            <option value="rating-desc">Rating descrescător</option>
                            <option value="rating-asc">Rating crescător</option>
                        </select>
                    </div>

                    <ul className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                        {reviews.length === 0 ? (
                            <li className="rounded-xl bg-gray-2/80 px-4 py-3.5 dark:bg-white/[0.04]">
                                <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                                    Nu există recenzii pentru acest meseriaș încă.
                                </p>
                            </li>
                        ) : filteredReviews.length === 0 ? (
                            <li className="rounded-xl bg-gray-2/80 px-4 py-3.5 dark:bg-white/[0.04]">
                                <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                                    Nu există recenzii pentru filtrele selectate.
                                </p>
                            </li>
                        ) : (
                            filteredReviews.map((review) => (
                                <li
                                    key={review.id}
                                    className="rounded-xl bg-gray-2/80 px-4 py-3.5 dark:bg-white/[0.04]"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-dark dark:text-white">
                                                {review.author}
                                            </p>
                                            <p className="mt-0.5 text-xs text-dark-5 dark:text-[#9CA3AF]">
                                                {review.project
                                                    ? `${review.project} · ${formatReviewDate(review.date)}`
                                                    : formatReviewDate(review.date)}
                                            </p>
                                        </div>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    {review.text ? (
                                        <p className="mt-2 text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                                            {review.text}
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-sm italic text-dark-5 dark:text-[#9CA3AF]">
                                            Fără comentariu text.
                                        </p>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </>,
        document.body
    );
}

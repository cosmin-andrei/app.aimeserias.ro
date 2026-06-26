"use client";

import { LOGIN_URL, REGISTER_URL } from "@/lib/auth-routes";
import type { MeseriasReview } from "@/types/meseriasProfile";
import { Lock, Star } from "lucide-react";
import { AuthButtons } from "./AuthPrompt";
import { ReviewPreviewCard } from "./ReviewPreviewCard";

type ReviewsGateProps = {
    meseriasName: string;
    rating: number;
    reviewCount: number;
    previewReviews: MeseriasReview[];
};

export function ReviewsGate({
    meseriasName,
    rating,
    reviewCount,
    previewReviews,
}: ReviewsGateProps) {
    const loginUrl = LOGIN_URL;
    const registerUrl = REGISTER_URL;
    const visiblePreviews = previewReviews.slice(0, 2);

    return (
        <section
            className="rounded-2xl border border-[#002050]/10 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#141414]"
            aria-label="Recenzii protejate"
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recenzii</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-[#9CA3AF]">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                        <span className="font-bold text-[#002050] dark:text-[#f1f6ff]">{rating.toFixed(1)}</span>
                        <span>
                            · {reviewCount} {reviewCount === 1 ? "recenzie" : "recenzii"}
                        </span>
                    </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0060f0]/10 text-[#0060f0]">
                    <Lock className="h-5 w-5" aria-hidden />
                </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                Pentru a citi recenziile clienților despre{" "}
                <span className="font-medium text-gray-900 dark:text-white">{meseriasName}</span>, autentifică-te
                sau creează un cont gratuit.
            </p>

            <div className="relative mt-5 space-y-3">
                {visiblePreviews.map((review) => (
                    <ReviewPreviewCard key={review.id} review={review} blurred />
                ))}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white dark:from-[#141414]/40 dark:via-[#141414]/70 dark:to-[#141414]" />
            </div>

            <AuthButtons loginUrl={loginUrl} registerUrl={registerUrl} />
        </section>
    );
}

export default ReviewsGate;

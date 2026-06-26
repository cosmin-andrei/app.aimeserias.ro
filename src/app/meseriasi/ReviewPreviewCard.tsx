"use client";

import { formatReviewDate } from "@/lib/meseriasProfile";
import { UserAvatar } from "@/components/UserAvatar";
import type { MeseriasReview } from "@/types/meseriasProfile";
import { Star } from "lucide-react";

type ReviewPreviewCardProps = {
    review: MeseriasReview;
    blurred?: boolean;
};

export function ReviewPreviewCard({ review, blurred }: ReviewPreviewCardProps) {
    return (
        <article
            className={`rounded-xl bg-white p-4 ring-1 ring-[#002050]/8 dark:bg-white/[0.04] dark:ring-white/[0.08] ${blurred ? "select-none" : ""}`}
        >
            <div className={`flex items-start justify-between gap-3 ${blurred ? "blur-[4px]" : ""}`}>
                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{review.author}</p>
                    {review.project && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-[#9CA3AF]">{review.project}</p>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`h-3 w-3 ${
                                i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-gray-200 text-gray-200 dark:fill-white/15 dark:text-white/15"
                            }`}
                            aria-hidden
                        />
                    ))}
                </div>
            </div>
            <p className={`mt-2 text-sm leading-relaxed text-gray-600 dark:text-[#9CA3AF] ${blurred ? "blur-[4px]" : ""}`}>
                {review.text}
            </p>
            <p className={`mt-2 text-xs text-gray-400 dark:text-[#6B7280] ${blurred ? "blur-[4px]" : ""}`}>
                {formatReviewDate(review.date)}
            </p>
        </article>
    );
}

type MemberRatingProps = {
    rating: number;
    reviewCount: number;
};

export function MemberRating({ rating, reviewCount }: MemberRatingProps) {
    return (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-[#9CA3AF]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
            <span className="font-bold text-[#002050] dark:text-[#f1f6ff]">{rating.toFixed(1)}</span>
            <span className="text-gray-500 dark:text-[#9CA3AF]">({reviewCount})</span>
        </p>
    );
}

type MemberAvatarProps = {
    name: string;
    image: string;
    size?: "md" | "lg" | "xl";
};

export function MemberAvatar({ name, image, size = "md" }: MemberAvatarProps) {
    const sizeClass =
        size === "xl"
            ? "h-20 w-20 sm:h-24 sm:w-24"
            : size === "lg"
              ? "h-16 w-16"
              : "h-14 w-14";
    const px = size === "xl" ? "96px" : size === "lg" ? "64px" : "56px";

    return (
        <UserAvatar
            src={image}
            alt={name}
            sizes={px}
            containerClassName={`relative ${sizeClass} shrink-0 overflow-hidden rounded-full bg-[#002050]/5 ring-2 ring-white shadow-md dark:bg-white/[0.04] dark:ring-[#141414]`}
        />
    );
}

import { Star } from "lucide-react";

type ClientRatingProps = {
    rating: number;
    reviewCount?: number;
    size?: "sm" | "md";
    showCount?: boolean;
    layout?: "inline" | "stacked";
};

export function ClientRating({
    rating,
    reviewCount = 0,
    size = "sm",
    showCount = true,
    layout = "inline",
}: ClientRatingProps) {
    const starClass = size === "md" ? "size-3.5" : "size-3";
    const textClass =
        size === "md"
            ? "text-sm font-semibold text-[#002050] dark:text-[#f1f6ff]"
            : "text-xs font-semibold text-[#002050] dark:text-[#f1f6ff]";
    const countClass =
        size === "md"
            ? "text-xs text-gray-500 dark:text-[#9CA3AF]"
            : "text-[10px] text-gray-500 dark:text-[#9CA3AF]";

    if (reviewCount === 0 && rating === 0) {
        return (
            <span className={`${countClass} text-gray-400 dark:text-[#6B7280]`}>Fără recenzii</span>
        );
    }

    const score = (
        <span className="inline-flex items-center gap-0.5" title={`${rating.toFixed(1)} din 5 stele`}>
            <Star className={`${starClass} fill-amber-400 text-amber-400`} aria-hidden />
            <span className={textClass}>{rating.toFixed(1)}</span>
        </span>
    );

    if (layout === "stacked") {
        return (
            <div className="flex flex-col items-end gap-0.5">
                {score}
                {showCount && reviewCount > 0 && (
                    <span className={countClass}>
                        {reviewCount} {reviewCount === 1 ? "recenzie" : "recenzii"}
                    </span>
                )}
            </div>
        );
    }

    return (
        <span className="inline-flex items-center gap-1" title={`${rating.toFixed(1)} din 5 stele`}>
            <Star className={`${starClass} fill-amber-400 text-amber-400`} aria-hidden />
            <span className={textClass}>{rating.toFixed(1)}</span>
            {showCount && reviewCount > 0 && (
                <span className={countClass}>
                    ({reviewCount})
                </span>
            )}
        </span>
    );
}

export default ClientRating;

import type { MeseriasReview } from "@/types/meseriasProfile";

export type MeseriasReviewSortOption = "newest" | "oldest" | "rating-desc" | "rating-asc";

export function filterAndSortMeseriasReviews(
    reviews: MeseriasReview[],
    ratingFilter: string,
    sortBy: MeseriasReviewSortOption
): MeseriasReview[] {
    let result = [...reviews];

    if (ratingFilter !== "all") {
        const minRating = parseInt(ratingFilter, 10);
        if (!Number.isNaN(minRating)) {
            result = result.filter((review) => review.rating === minRating);
        }
    }

    result.sort((a, b) => {
        switch (sortBy) {
            case "oldest":
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            case "rating-desc":
                return b.rating - a.rating || new Date(b.date).getTime() - new Date(a.date).getTime();
            case "rating-asc":
                return a.rating - b.rating || new Date(b.date).getTime() - new Date(a.date).getTime();
            case "newest":
            default:
                return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
    });

    return result;
}

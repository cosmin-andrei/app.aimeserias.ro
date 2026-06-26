"use client";

import {
  getMyReceivedReviews,
  replyToReview,
  type MyReviewsResponse,
  type ReviewAnsweredFilter,
  type ReviewSortOption,
  type WorkerReviewItem,
} from "@/lib/api-client";
import { Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type DashboardReviewsPopupProps = {
  open: boolean;
  closing: boolean;
  entered: boolean;
  onClose: () => void;
  onSummaryChange?: (summary: MyReviewsResponse["summary"]) => void;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} din 5 stele`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-white/20"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

function ReviewReplyForm({
  review,
  onSaved,
}: {
  review: WorkerReviewItem;
  onSaved: (review: WorkerReviewItem) => void;
}) {
  const [draft, setDraft] = useState(review.response || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!draft.trim()) {
      setError("Scrie un răspuns înainte de a trimite.");
      return;
    }
    setSaving(true);
    setError(null);
    const { success, review: updated, error: saveError } = await replyToReview(
      review.id,
      draft.trim()
    );
    setSaving(false);
    if (!success || !updated) {
      setError(saveError || "Nu am putut trimite răspunsul.");
      return;
    }
    onSaved(updated);
  };

  return (
    <div className="mt-3 border-t border-stroke/60 pt-3 dark:border-white/[0.08]">
      {review.hasResponse && (
        <p className="mb-2 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
          Răspunsul tău{review.responseAt ? ` · ${review.responseAt}` : ""}
        </p>
      )}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Scrie un răspuns profesionist pentru client..."
        className="w-full resize-y rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-dark shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
        maxLength={2000}
      />
      {error && <p className="mt-2 text-xs text-red dark:text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Se trimite…" : review.hasResponse ? "Actualizează răspunsul" : "Trimite răspuns"}
      </button>
    </div>
  );
}

export function DashboardReviewsPopup({
  open,
  closing,
  entered,
  onClose,
  onSummaryChange,
}: DashboardReviewsPopupProps) {
  const [loading, setLoading] = useState(false);
  const [workerOnly, setWorkerOnly] = useState(false);
  const [reviews, setReviews] = useState<WorkerReviewItem[]>([]);
  const [summary, setSummary] = useState<MyReviewsResponse["summary"]>({
    average_rating: 0,
    total: 0,
  });
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [answeredFilter, setAnsweredFilter] = useState<ReviewAnsweredFilter>("all");
  const [sortBy, setSortBy] = useState<ReviewSortOption>("newest");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyReceivedReviews({
      rating: ratingFilter === "all" ? undefined : parseInt(ratingFilter, 10),
      answered: answeredFilter,
      sort: sortBy,
    });
    if (data) {
      setReviews(data.reviews);
      setSummary(data.summary);
      setWorkerOnly(!!data.worker_only);
      onSummaryChange?.(data.summary);
    }
    setLoading(false);
  }, [answeredFilter, onSummaryChange, ratingFilter, sortBy]);

  useEffect(() => {
    if (open) void loadReviews();
  }, [open, loadReviews]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[110] bg-black/50 backdrop-blur-md ${
          closing ? "animate-backdrop-exit" : entered ? "animate-backdrop-enter" : "opacity-0"
        }`}
        aria-hidden
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recenzii-title"
          className={`flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1A1A1A] dark:ring-1 dark:ring-white/[0.08] pointer-events-auto ${
            closing ? "animate-modal-exit" : entered ? "animate-modal-enter" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-stroke/80 px-5 py-4 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-green/15 dark:bg-green/20">
                <Star size={22} strokeWidth={2} className="fill-amber-400 text-amber-400" />
              </span>
              <div>
                <h2 id="recenzii-title" className="text-lg font-semibold tracking-tight text-dark dark:text-white">
                  Recenzii
                </h2>
                <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
                  {loading
                    ? "Se încarcă..."
                    : summary.total > 0
                      ? `Rating mediu ${summary.average_rating.toFixed(1)} · ${summary.total} ${summary.total === 1 ? "recenzie" : "recenzii"}`
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
              value={answeredFilter}
              onChange={(e) => setAnsweredFilter(e.target.value as ReviewAnsweredFilter)}
              className="rounded-lg border border-stroke bg-white px-2.5 py-1.5 text-xs font-medium text-dark dark:border-white/[0.12] dark:bg-[#141414] dark:text-white"
              aria-label="Filtrează după răspuns"
            >
              <option value="all">Toate</option>
              <option value="no">Fără răspuns</option>
              <option value="yes">Cu răspuns</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
              className="rounded-lg border border-stroke bg-white px-2.5 py-1.5 text-xs font-medium text-dark dark:border-white/[0.12] dark:bg-[#141414] dark:text-white"
              aria-label="Sortează recenziile"
            >
              <option value="newest">Cele mai noi</option>
              <option value="oldest">Cele mai vechi</option>
              <option value="rating-desc">Rating descrescător</option>
              <option value="rating-asc">Rating crescător</option>
            </select>
          </div>

          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 custom-scrollbar">
            {loading ? (
              <li className="rounded-xl bg-gray-2/80 px-4 py-3.5 dark:bg-white/[0.04]">
                <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă recenziile...</p>
              </li>
            ) : workerOnly ? (
              <li className="rounded-xl bg-gray-2/80 px-4 py-3.5 dark:bg-white/[0.04]">
                <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Recenziile primite sunt disponibile pentru conturile de meseriaș.
                </p>
              </li>
            ) : reviews.length === 0 ? (
              <li className="rounded-xl bg-gray-2/80 px-4 py-3.5 dark:bg-white/[0.04]">
                <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Nu există recenzii pentru filtrele selectate.
                </p>
              </li>
            ) : (
              reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-xl bg-gray-2/80 px-4 py-3.5 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-dark dark:text-white">{review.authorName}</p>
                      <p className="mt-0.5 text-xs text-dark-5 dark:text-[#9CA3AF]">
                        {review.projectTitle} · {review.createdAt}
                      </p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm italic text-dark-5 dark:text-[#9CA3AF]">
                      Fără comentariu text.
                    </p>
                  )}
                  {!workerOnly && (
                    <ReviewReplyForm
                      review={review}
                      onSaved={(updated) => {
                        setReviews((prev) =>
                          prev.map((item) => (item.id === updated.id ? updated : item))
                        );
                      }}
                    />
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

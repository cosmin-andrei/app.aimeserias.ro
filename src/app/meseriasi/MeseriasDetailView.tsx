"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  MapPin,
  Star,
  User,
} from "lucide-react";
import { BrandGradientPlaceholder } from "@/components/BrandGradientPlaceholder";
import { SpecializationChip } from "@/components/SpecializationChip";
import { UserAvatar } from "@/components/UserAvatar";
import { getWorkerById, getWorkerReviews } from "@/lib/api-client";
import { getCategoryLabel, getMeseriasDisplayTypeLabel } from "@/lib/meserias";
import {
  apiReviewToMeseriasReview,
  getWorkerCoverImageUrl,
  workerProfileToMeserias,
} from "@/lib/marketplace-mappers";
import { detailPageClass } from "@/lib/page-layout";
import type { Meserias } from "@/types/meserias";
import type { MeseriasReview } from "@/types/meseriasProfile";
import { MeseriasProfileSidebar } from "./MeseriasProfileSidebar";

function formatMemberSince(date: string) {
  return new Date(date).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
}

type MeseriasDetailViewProps = {
  workerId: number;
};

export function MeseriasDetailView({ workerId }: MeseriasDetailViewProps) {
  const [meserias, setMeserias] = useState<Meserias | null>(null);
  const [reviews, setReviews] = useState<MeseriasReview[]>([]);
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [workerUserId, setWorkerUserId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      const [{ data: worker, error: workerError }, { data: reviewRows }] = await Promise.all([
        getWorkerById(workerId),
        getWorkerReviews(workerId),
      ]);

      if (cancelled) return;

      if (!worker) {
        setMeserias(null);
        setError(workerError ?? "Meseriașul nu a fost găsit.");
        setLoading(false);
        return;
      }

      setMeserias(workerProfileToMeserias(worker));
      setCoverImage(getWorkerCoverImageUrl(worker.cover_image));
      setWorkerUserId(worker.user_id);
      setReviews((reviewRows ?? []).map(apiReviewToMeseriasReview));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [workerId]);

  if (loading) {
    return (
      <section className="pb-10 pt-2 md:pb-14 md:pt-4">
        <div className={detailPageClass}>
          <div className="h-[480px] animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
      </section>
    );
  }

  if (!meserias || error) {
    return (
      <section className="pb-10 pt-2 md:pb-14 md:pt-4">
        <div className={detailPageClass}>
          <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
            <p className="text-lg font-medium text-dark dark:text-white">
              {error ?? "Meseriașul nu a fost găsit."}
            </p>
            <Link
              href="/meseriasi"
              className="mt-4 inline-flex text-sm font-medium text-[#0060f0] hover:underline dark:text-[#5b9fff]"
            >
              Înapoi la meseriași
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const typeLabel = getMeseriasDisplayTypeLabel(meserias);

  return (
    <section className="pb-10 pt-2 md:pb-14 md:pt-4">
      <div className={detailPageClass}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-8 2xl:grid-cols-[1.35fr_0.65fr] 2xl:gap-10">
          <div className="overflow-hidden rounded-2xl border border-[#002050]/10 bg-white shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:bg-[#141414] dark:ring-white/[0.06]">
            <div className="relative h-44 w-full overflow-hidden sm:h-52 md:h-56">
              {coverImage ? (
                <>
                  <Image
                    src={coverImage}
                    alt={`Lucrări realizate de ${meserias.name}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 65vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001535]/75 via-[#001535]/25 to-transparent" />
                </>
              ) : (
                <BrandGradientPlaceholder showBottomOverlay />
              )}

              {meserias.categories.length > 0 && (
                <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-2 p-4 sm:p-5">
                  {meserias.categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/meseriasi?categorie=${encodeURIComponent(cat)}`}
                      className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/20 transition-colors hover:bg-white/25"
                    >
                      {getCategoryLabel(cat)}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href="/meseriasi"
                className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-5 sm:top-5"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Înapoi la meseriași
              </Link>

              {meserias.verified && (
                <span className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm sm:right-5 sm:top-5">
                  <CheckCircle2 className="size-3.5 text-white" aria-hidden />
                  Verificat
                </span>
              )}
            </div>

            <div className="relative px-5 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-5">
                <div className="-mt-10 shrink-0 sm:-mt-12">
                  <div className="relative h-[6.5rem] w-[6.5rem] overflow-hidden rounded-full bg-white ring-4 ring-white shadow-lg dark:bg-[#141414] dark:ring-[#141414] sm:h-28 sm:w-28 sm:ring-[5px]">
                    <UserAvatar
                      src={meserias.image}
                      alt={meserias.name}
                      sizes="112px"
                      priority
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1 sm:pb-1 sm:pt-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                    {meserias.name}
                  </h1>
                  <p className="mt-2 text-base text-gray-600 dark:text-[#9CA3AF]">
                    {meserias.tagline}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0060f0]/10 px-3 py-1 text-xs font-semibold text-[#0060f0] dark:bg-white/[0.08] dark:text-[#c5d4f5]">
                      <User className="size-2.5" aria-hidden />
                      {typeLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-[#9CA3AF] sm:mt-7">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                  {meserias.location}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#002050] dark:text-[#f1f6ff]">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  {meserias.rating.toFixed(1)} ({meserias.reviewCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-4" aria-hidden />
                  {meserias.completedProjects} proiecte finalizate
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden />
                  Membru din {formatMemberSince(meserias.memberSince)}
                </span>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Despre</h2>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                  {meserias.description}
                </p>
              </div>

              {meserias.trades.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Specializări</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {meserias.trades.map((trade) => (
                      <SpecializationChip key={trade} label={trade} hasStudies={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <MeseriasProfileSidebar
              meseriasName={meserias.name}
              rating={meserias.rating}
              reviewCount={meserias.reviewCount}
              previewReviews={reviews}
              phone={meserias.phone}
              email={meserias.email}
              workerUserId={workerUserId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import { BrandGradientPlaceholder } from "@/components/BrandGradientPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { getCompanyById } from "@/lib/api-client";
import {
  companyMembersToFirmaTeam,
  companyProfileToMeserias,
  getWorkerCoverImageUrl,
} from "@/lib/marketplace-mappers";
import { detailPageClass } from "@/lib/page-layout";
import type { Meserias } from "@/types/meserias";
import type { FirmaTeamMember } from "@/types/meseriasProfile";
import { MeseriasProfileSidebar } from "./MeseriasProfileSidebar";
import { TeamMembersSection } from "./TeamMembersSection";

function formatMemberSince(date: string) {
  return new Date(date).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
}

type CompanyDetailViewProps = {
  companyUserId: number;
};

export function CompanyDetailView({ companyUserId }: CompanyDetailViewProps) {
  const [meserias, setMeserias] = useState<Meserias | null>(null);
  const [teamMembers, setTeamMembers] = useState<FirmaTeamMember[]>([]);
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      const { data: company, error: companyError } = await getCompanyById(companyUserId);

      if (cancelled) return;

      if (!company) {
        setMeserias(null);
        setError(companyError ?? "Firma nu a fost găsită.");
        setLoading(false);
        return;
      }

      setMeserias(companyProfileToMeserias(company));
      setTeamMembers(companyMembersToFirmaTeam(company.members));
      setCoverImage(getWorkerCoverImageUrl(company.cover_image));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [companyUserId]);

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
              {error ?? "Firma nu a fost găsită."}
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

  return (
    <section className="pb-10 pt-2 md:pb-14 md:pt-4">
      <div className={detailPageClass}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-8 2xl:grid-cols-[1.35fr_0.65fr] 2xl:gap-10">
          <div className="overflow-hidden rounded-2xl border border-[#002050]/10 bg-white shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:bg-[#141414] dark:ring-white/[0.06]">
            <div className="relative h-44 w-full overflow-hidden sm:h-52 md:h-56">
              {coverImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={`Profil ${meserias.name}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001535]/75 via-[#001535]/25 to-transparent" />
                </>
              ) : (
                <BrandGradientPlaceholder showBottomOverlay />
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
                  <div className="relative flex h-[6.5rem] w-[6.5rem] items-center justify-center overflow-hidden rounded-full bg-[#16366d]/10 ring-4 ring-white shadow-lg dark:bg-[#2eb8f0]/15 dark:ring-[#141414] sm:h-28 sm:w-28 sm:ring-[5px]">
                    {meserias.image ? (
                      <UserAvatar
                        src={meserias.image}
                        alt={meserias.name}
                        sizes="112px"
                        priority
                      />
                    ) : (
                      <Building2 className="size-10 text-[#16366d] dark:text-[#5b9fff]" aria-hidden />
                    )}
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
                      <Building2 className="size-3.5" aria-hidden />
                      Firmă
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <Users className="size-3.5" aria-hidden />
                      {meserias.teamSize ?? 0} meseriași asociați
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
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Informații companie</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {meserias.companyCui && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
                      <p className="text-xs font-medium text-gray-500 dark:text-[#9CA3AF]">CUI</p>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{meserias.companyCui}</p>
                    </div>
                  )}
                  {meserias.companyRegCom && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
                      <p className="text-xs font-medium text-gray-500 dark:text-[#9CA3AF]">Nr. Reg. Comerțului</p>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{meserias.companyRegCom}</p>
                    </div>
                  )}
                  {meserias.companyLegalForm && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
                      <p className="text-xs font-medium text-gray-500 dark:text-[#9CA3AF]">Formă juridică</p>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{meserias.companyLegalForm}</p>
                    </div>
                  )}
                  {meserias.companyAddress && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 sm:col-span-2 dark:border-white/[0.08] dark:bg-white/[0.03]">
                      <p className="text-xs font-medium text-gray-500 dark:text-[#9CA3AF]">Sediu social</p>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{meserias.companyAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {meserias.description && (
                <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Despre</h2>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                    {meserias.description}
                  </p>
                </div>
              )}

              <TeamMembersSection firmaName={meserias.name} members={teamMembers} />
            </div>
          </div>

          <MeseriasProfileSidebar
            meseriasName={meserias.name}
            rating={meserias.rating}
            reviewCount={meserias.reviewCount}
            previewReviews={[]}
            phone={meserias.phone}
            email={meserias.email}
          />
        </div>
      </div>
    </section>
  );
}

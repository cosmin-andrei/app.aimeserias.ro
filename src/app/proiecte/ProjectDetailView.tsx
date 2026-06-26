"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import { getJob, getJobOffers } from "@/lib/api-client";
import { apiJobToProject } from "@/lib/marketplace-mappers";
import { detailPageClass } from "@/lib/page-layout";
import { getStatusStyle } from "@/lib/project";
import type { Project } from "@/types/project";
import { ClientProfile } from "./ClientProfile";
import { OfferGate } from "./OfferGate";

type ProjectDetailViewProps = {
  jobId: number;
};

export function ProjectDetailView({ jobId }: ProjectDetailViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      const [{ data: job, error: jobError }, { data: offers }] = await Promise.all([
        getJob(jobId),
        getJobOffers(jobId),
      ]);

      if (cancelled) return;

      if (!job) {
        setProject(null);
        setError(jobError ?? "Proiectul nu a fost găsit.");
        setLoading(false);
        return;
      }

      setProject(
        apiJobToProject(job, {
          offerCount: offers?.length ?? 0,
        })
      );
      setDescription(job.description);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (loading) {
    return (
      <section className="pb-10 pt-2 md:pb-14 md:pt-4">
        <div className={detailPageClass}>
          <div className="h-[520px] animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
      </section>
    );
  }

  if (!project || error) {
    return (
      <section className="pb-10 pt-2 md:pb-14 md:pt-4">
        <div className={detailPageClass}>
          <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
            <p className="text-lg font-medium text-dark dark:text-white">
              {error ?? "Proiectul nu a fost găsit."}
            </p>
            <Link
              href="/proiecte"
              className="mt-4 inline-flex text-sm font-medium text-[#0060f0] hover:underline dark:text-[#5b9fff]"
            >
              Înapoi la proiecte
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const jobIdNum = Number(project.id);
  const clientUserId = Number(project.client.id);

  return (
    <section className="pb-10 pt-2 md:pb-14 md:pt-4">
      <div className={detailPageClass}>
        <Link
          href="/proiecte"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#0060f0] transition-colors hover:text-[#002050] dark:text-[#5b9fff] dark:hover:text-[#f1f6ff]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Înapoi la proiecte
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-8 2xl:grid-cols-[1.35fr_0.65fr] 2xl:gap-10">
          <article className="overflow-hidden rounded-2xl border border-[#002050]/10 bg-white shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:bg-[#141414] dark:ring-white/[0.06]">
            <div className="p-6 md:p-8">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#0060f0]/10 px-3 py-1 text-xs font-semibold text-[#0060f0] dark:bg-white/[0.08] dark:text-[#c5d4f5]">
                  {project.category}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusStyle(project.status)}`}
                >
                  {project.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                {project.title}
              </h1>
              <p className="mt-2 text-base text-gray-600 dark:text-[#9CA3AF]">
                {project.excerpt}
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-[#9CA3AF]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                  {project.location}
                </span>
                {project.budget && (
                  <span className="flex items-center gap-1.5 font-semibold text-[#002050] dark:text-[#f1f6ff]">
                    <Briefcase className="size-4" aria-hidden />
                    {project.budget}
                  </span>
                )}
                {project.applicants != null && (
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                    {project.applicants} oferte depuse
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-[#6B7280]">
                  <Calendar className="size-4" aria-hidden />
                  Publicat {project.date}
                </span>
              </div>

              {project.trades.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.trades.map((trade) => (
                    <span
                      key={trade}
                      className="rounded-md bg-[#002050]/5 px-3 py-1 text-sm font-medium text-[#002050]/80 dark:bg-white/[0.08] dark:text-[#c5d4f5]"
                    >
                      {trade}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 border-t border-gray-100 pt-8 dark:border-white/[0.08]">
                <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                  {description}
                </div>
              </div>
            </div>
          </article>

          <div className="space-y-5 lg:sticky lg:top-24">
            <ClientProfile client={project.client} variant="card" />
            <OfferGate
              projectTitle={project.title}
              clientName={project.client.name}
              clientUserId={Number.isFinite(clientUserId) ? clientUserId : undefined}
              jobId={Number.isFinite(jobIdNum) ? jobIdNum : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { DashboardProjectCard } from "./DashboardProjectCard";
import { searchJobs } from "@/lib/api-client";
import { apiJobToProject } from "@/lib/marketplace-mappers";
import { dashboardCardGridClass } from "@/lib/page-layout";
import { ArrowRight, Briefcase } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Project } from "@/types/project";

const MAX_ITEMS = 3;

export function LatestProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await searchJobs({ status: "open" });
      if (cancelled) return;
      setProjects((data ?? []).slice(0, MAX_ITEMS).map((job) => apiJobToProject(job)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl bg-white/60 p-6 ring-1 ring-black/[0.04] dark:bg-white/[0.02] dark:ring-white/[0.06] sm:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#16366d]/10 text-[#16366d] dark:bg-[#f1f6ff]/20 dark:text-[#f1f6ff]">
          <Briefcase className="size-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-dark dark:text-white">
            Ultimele proiecte
          </h2>
        </div>
        <Link
          href="/proiecte"
          className="inline-flex items-center gap-1.5 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-[#16366d] shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-[#f1f6ff] dark:hover:bg-white/[0.12]"
        >
          Vezi toate
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className={dashboardCardGridClass}>
          {Array.from({ length: MAX_ITEMS }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
          Nu există proiecte publicate.
        </p>
      ) : (
        <div className={dashboardCardGridClass}>
          {projects.map((project) => (
            <DashboardProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}

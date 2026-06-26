"use client";

import { ProjectCoverImage } from "@/components/ProjectCoverImage";
import { hasMediaImage } from "@/lib/media";
import { getStatusStyle } from "@/lib/project";
import type { Project } from "@/types/project";
import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";

type DashboardProjectCardProps = {
  project: Project;
};

export function DashboardProjectCard({ project }: DashboardProjectCardProps) {
  return (
    <Link
      href={`/proiecte/${project.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-white shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[#16366d]/15 dark:bg-[#141414] dark:ring-white/[0.06] dark:hover:ring-[#f1f6ff]/20"
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden rounded-t-xl bg-[#002050]/10 dark:bg-white/[0.04]">
        <ProjectCoverImage
          src={project.image}
          alt={project.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          hoverScale
        />
        {hasMediaImage(project.image) && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[30%] bg-[linear-gradient(to_top,rgb(8,8,10)_0%,rgb(8,8,10)_42%,rgba(8,8,10,0.88)_62%,rgba(8,8,10,0.18)_90%,transparent_100%)]"
            aria-hidden
          />
        )}
        <span className="absolute left-2.5 top-2.5 z-10 max-w-[60%] truncate rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
          {project.category}
        </span>
        <div className="absolute inset-x-0 bottom-0 z-10 px-2.5 pb-2.5 pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-white/90">
              <MapPin className="size-2.5 shrink-0" aria-hidden />
              <span className="truncate">{project.location}</span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${getStatusStyle(project.status)}`}
            >
              {project.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-dark transition-colors group-hover:text-[#16366d] dark:text-white dark:group-hover:text-[#f1f6ff]">
          {project.title}
        </h3>

        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
          {project.excerpt}
        </p>

        {project.trades.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {project.trades.slice(0, 2).map((trade) => (
              <span
                key={trade}
                className="rounded-full bg-[#16366d]/8 px-2 py-0.5 text-[10px] font-medium text-[#16366d]/80 dark:bg-white/[0.08] dark:text-[#c5d4f5]"
              >
                {trade}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-stroke/60 pt-3 dark:border-white/[0.08]">
          <div className="min-w-0">
            {project.budget && (
              <p className="truncate text-sm font-bold text-[#16366d] dark:text-[#f1f6ff]">
                {project.budget}
              </p>
            )}
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-dark-5 dark:text-[#9CA3AF]">
              <Calendar className="size-2.5 shrink-0" aria-hidden />
              {project.date}
            </p>
          </div>
          {project.applicants != null && project.applicants > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#16366d]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16366d] dark:bg-white/[0.08] dark:text-[#c5d4f5]">
              <Users className="size-2.5" aria-hidden />
              {project.applicants}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

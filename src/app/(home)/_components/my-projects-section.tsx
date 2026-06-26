"use client";

import { getMyJobs, type MyJobItem } from "@/lib/api-client";
import { ArrowRight, FolderKanban, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const JOB_STATUS_LABELS: Record<string, string> = {
  open: "Caut meseriași",
  assigned: "Atribuit",
  in_progress: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
};

const JOB_STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  assigned:
    "bg-[#0060f0]/10 text-[#0060f0] ring-[#0060f0]/20 dark:bg-[#5b9fff]/10 dark:text-[#5b9fff] dark:ring-[#5b9fff]/20",
  in_progress:
    "bg-[#0060f0]/10 text-[#0060f0] ring-[#0060f0]/20 dark:bg-[#5b9fff]/10 dark:text-[#5b9fff] dark:ring-[#5b9fff]/20",
  completed:
    "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  cancelled:
    "bg-gray-100 text-gray-600 ring-gray-200/70 dark:bg-white/10 dark:text-[#9CA3AF] dark:ring-white/10",
};

const MAX_ITEMS = 5;

function formatBudget(job: MyJobItem): string {
  const min = job.budget_min;
  const max = job.budget_max;
  if (min == null && max == null) return "Buget nespecificat";
  if (min != null && max != null) {
    return `${min.toLocaleString("ro-RO")} – ${max.toLocaleString("ro-RO")} RON`;
  }
  const value = min ?? max;
  return value != null ? `${value.toLocaleString("ro-RO")} RON` : "Buget nespecificat";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProjectRow({ job }: { job: MyJobItem }) {
  const statusLabel = JOB_STATUS_LABELS[job.status] ?? job.status;
  const statusStyle = JOB_STATUS_STYLES[job.status] ?? JOB_STATUS_STYLES.open;

  return (
    <Link
      href={`/proiecte/${job.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-transparent bg-white p-4 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#16366d]/10 hover:shadow-md hover:ring-[#16366d]/15 dark:bg-[#141414] dark:ring-white/[0.06] dark:hover:ring-[#f1f6ff]/20 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-dark transition-colors group-hover:text-[#16366d] dark:text-white dark:group-hover:text-[#f1f6ff]">
          {job.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {job.city}
          </span>
          <span>{job.category}</span>
          <span>{formatBudget(job)}</span>
          <span>Publicat {formatDate(job.created_at)}</span>
        </div>
      </div>
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyle}`}
      >
        {statusLabel}
      </span>
    </Link>
  );
}

export function MyProjectsSection() {
  const [jobs, setJobs] = useState<MyJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data, error: fetchError } = await getMyJobs();
      if (cancelled) return;
      setJobs(data ?? []);
      setError(fetchError ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleJobs = jobs.slice(0, MAX_ITEMS);

  return (
    <section className="rounded-2xl bg-white/60 p-6 ring-1 ring-black/[0.04] dark:bg-white/[0.02] dark:ring-white/[0.06] sm:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#16366d]/10 text-[#16366d] dark:bg-[#f1f6ff]/20 dark:text-[#f1f6ff]">
          <FolderKanban className="size-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-dark dark:text-white">
            Proiectele tale
          </h2>
        </div>
        <Link
          href="/proiecte?view=mine"
          className="inline-flex items-center gap-1.5 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-[#16366d] shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-[#f1f6ff] dark:hover:bg-white/[0.12]"
        >
          Vezi toate
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-stroke/60 bg-white/50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">{error}</p>
        </div>
      ) : visibleJobs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stroke/60 bg-white/50 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <FolderKanban className="mx-auto size-10 text-dark-5/50 dark:text-[#9CA3AF]/50" strokeWidth={1} />
          <p className="mt-3 text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
            Nu ai proiecte publicate încă
          </p>
          <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
            Adaugă un proiect pentru a primi oferte de la meseriași
          </p>
          <Link
            href="/proiecte/adauga"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#16366d] hover:underline dark:text-[#f1f6ff]"
          >
            Adaugă proiect
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleJobs.map((job) => (
            <ProjectRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

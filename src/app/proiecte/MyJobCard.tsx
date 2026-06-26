import Link from "next/link";
import { Briefcase, Calendar, MapPin } from "lucide-react";
import type { MyJobItem } from "@/lib/api-client";

const JOB_STATUS_LABELS: Record<string, string> = {
    open: "Caut meseriași",
    assigned: "Atribuit",
    in_progress: "În desfășurare",
    completed: "Finalizat",
    cancelled: "Anulat",
};

const JOB_STATUS_STYLES: Record<string, string> = {
    open: "bg-amber-400/15 text-amber-700 ring-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    assigned: "bg-[#0060f0]/10 text-[#0060f0] ring-[#0060f0]/20 dark:bg-[#5b9fff]/10 dark:text-[#5b9fff] dark:ring-[#5b9fff]/20",
    in_progress: "bg-[#0060f0]/10 text-[#0060f0] ring-[#0060f0]/20 dark:bg-[#5b9fff]/10 dark:text-[#5b9fff] dark:ring-[#5b9fff]/20",
    completed: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    cancelled: "bg-gray-100 text-gray-600 ring-gray-200/70 dark:bg-white/10 dark:text-[#9CA3AF] dark:ring-white/10",
};

function formatBudget(job: MyJobItem): string | null {
    const min = job.budget_min;
    const max = job.budget_max;
    if (min == null && max == null) return null;
    if (min != null && max != null) {
        return `${min.toLocaleString("ro-RO")} – ${max.toLocaleString("ro-RO")} RON`;
    }
    const value = min ?? max;
    return value != null ? `${value.toLocaleString("ro-RO")} RON` : null;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

type MyJobCardProps = {
    job: MyJobItem;
};

export function MyJobCard({ job }: MyJobCardProps) {
    const budget = formatBudget(job);
    const statusLabel = JOB_STATUS_LABELS[job.status] ?? job.status;
    const statusStyle = JOB_STATUS_STYLES[job.status] ?? JOB_STATUS_STYLES.open;

    return (
        <Link
            href={`/proiecte/${job.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[#16366d]/15 dark:bg-[#141414] dark:ring-white/[0.06] dark:hover:ring-[#f1f6ff]/20"
        >
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#0060f0]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#0060f0] dark:bg-white/[0.08] dark:text-[#c5d4f5]">
                    {job.category}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${statusStyle}`}>
                    {statusLabel}
                </span>
            </div>

            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-dark transition-colors group-hover:text-[#16366d] dark:text-white dark:group-hover:text-[#f1f6ff]">
                {job.title}
            </h3>

            <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                {job.description}
            </p>

            <div className="mt-4 space-y-2 border-t border-stroke/60 pt-3 dark:border-white/[0.08]">
                <p className="flex items-center gap-1.5 text-xs text-dark-5 dark:text-[#9CA3AF]">
                    <MapPin className="size-3.5 shrink-0 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                    {job.city}
                </p>
                {budget && (
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[#16366d] dark:text-[#f1f6ff]">
                        <Briefcase className="size-3.5 shrink-0" aria-hidden />
                        {budget}
                    </p>
                )}
                <p className="flex items-center gap-1.5 text-[10px] text-dark-5 dark:text-[#9CA3AF]">
                    <Calendar className="size-3 shrink-0" aria-hidden />
                    Publicat {formatDate(job.created_at)}
                </p>
            </div>
        </Link>
    );
}

export default MyJobCard;

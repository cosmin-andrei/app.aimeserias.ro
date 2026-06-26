import { getStatusDotColor } from "@/lib/project";

type ProjectStatusCoverBadgeProps = {
    status: string;
    className?: string;
};

export function ProjectStatusCoverBadge({ status, className = "" }: ProjectStatusCoverBadgeProps) {
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-md ${className}`}
        >
            <span
                className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotColor(status)} shadow-[0_0_8px_rgba(255,255,255,0.35)] ring-1 ring-white/40`}
                aria-hidden
            />
            <span className="truncate leading-tight">{status}</span>
        </span>
    );
}

export default ProjectStatusCoverBadge;

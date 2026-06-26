import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type SpecializationChipProps = {
  label: string;
  hasStudies?: boolean;
};

export function SpecializationChip({ label, hasStudies = false }: SpecializationChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        hasStudies
          ? "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-100 dark:ring-emerald-400/30"
          : "bg-[#002050]/[0.05] text-[#002050]/75 dark:bg-white/[0.06] dark:text-white/80"
      )}
    >
      {hasStudies && <GraduationCap className="size-3.5 shrink-0" aria-hidden />}
      {label}
      {hasStudies && <span className="sr-only"> — studii verificate în domeniu</span>}
    </span>
  );
}

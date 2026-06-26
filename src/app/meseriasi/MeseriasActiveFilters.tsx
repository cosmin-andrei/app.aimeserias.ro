"use client";

import { X } from "lucide-react";
import {
    DEFAULT_MESERIAS_FILTERS,
    getActiveMeseriasFilters,
    removeMeseriasFilter,
    type MeseriasFiltersState,
} from "@/lib/meserias";

type MeseriasActiveFiltersProps = {
    filters: MeseriasFiltersState;
    onChange: (filters: MeseriasFiltersState) => void;
};

export function MeseriasActiveFilters({ filters, onChange }: MeseriasActiveFiltersProps) {
    const active = getActiveMeseriasFilters(filters);

    if (active.length === 0) return null;

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {active.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={() => onChange(removeMeseriasFilter(filters, item.key))}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stroke bg-white px-3 py-1 text-xs text-dark shadow-sm transition-colors hover:border-gray-300 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-[#E5E7EB] dark:hover:border-white/[0.18] dark:hover:bg-white/[0.1]"
                >
                    {item.label}
                    <X className="h-3 w-3 text-dark-5 dark:text-[#9CA3AF]" aria-hidden />
                </button>
            ))}
            <button
                type="button"
                onClick={() => onChange(DEFAULT_MESERIAS_FILTERS)}
                className="text-xs font-medium text-[#0060f0] hover:underline dark:text-[#5b9fff]"
            >
                Șterge toate
            </button>
        </div>
    );
}

export default MeseriasActiveFilters;

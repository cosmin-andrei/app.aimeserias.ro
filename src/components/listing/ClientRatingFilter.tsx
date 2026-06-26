"use client";

import { Star } from "lucide-react";
import { CLIENT_RATING_FILTERS } from "@/data/projectFilters";

type ClientRatingFilterProps = {
    value: string;
    onChange: (value: string) => void;
    counts?: Record<string, number>;
};

function StarRow({ filledCount }: { filledCount: number }) {
    return (
        <span className="inline-flex gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`size-3 ${i < filledCount ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-white/20"}`}
                />
            ))}
        </span>
    );
}

export function ClientRatingFilter({ value, onChange, counts }: ClientRatingFilterProps) {
    const toggle = (optionValue: string) => {
        onChange(value === optionValue ? "toate" : optionValue);
    };

    return (
        <ul className="space-y-0.5">
            {CLIENT_RATING_FILTERS.map((option) => {
                const checked = value === option.value;

                return (
                    <li key={option.value}>
                        <label
                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
                                checked
                                    ? "bg-[#0060f0]/8 ring-1 ring-[#0060f0]/15 dark:bg-[#5b9fff]/10 dark:ring-[#5b9fff]/20"
                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(option.value)}
                                className="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-[#0060f0] focus:ring-[#0060f0]/30"
                            />
                            <StarRow filledCount={option.stars} />
                            <span className="min-w-0 flex-1 text-xs text-gray-800 dark:text-[#E5E7EB]">
                                {option.label}
                                {counts?.[option.value] != null && (
                                    <span className="text-gray-400"> ({counts[option.value]})</span>
                                )}
                            </span>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
}

export default ClientRatingFilter;

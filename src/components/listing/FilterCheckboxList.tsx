"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type FilterCheckboxOption = {
    value: string;
    label: string;
    count?: number;
};

type FilterCheckboxListProps = {
    options: FilterCheckboxOption[];
    value: string;
    onChange: (value: string) => void;
    defaultValue?: string;
    visibleCount?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
};

export function FilterCheckboxList({
    options,
    value,
    onChange,
    defaultValue = "toate",
    visibleCount = 6,
    searchable = false,
    searchPlaceholder = "Caută...",
}: FilterCheckboxListProps) {
    const [expanded, setExpanded] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.trim().toLowerCase();
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, search]);

    const visible = expanded ? filtered : filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    const toggle = (optionValue: string) => {
        onChange(value === optionValue ? defaultValue : optionValue);
    };

    return (
        <div className="space-y-2">
            {searchable && (
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/60 py-2 pl-8 pr-2.5 text-xs text-gray-900 outline-none focus:border-[#0060f0] focus:bg-white focus:ring-2 focus:ring-[#0060f0]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white dark:focus:border-[#5b9fff] dark:focus:bg-white/[0.06] dark:focus:ring-[#5b9fff]/20"
                    />
                </div>
            )}

            <ul className="space-y-0.5">
                {visible.map((option) => {
                    const checked = value === option.value;
                    return (
                        <li key={option.value}>
                            <label
                                className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
                                    checked
                                        ? "bg-[#0060f0]/8 ring-1 ring-[#0060f0]/15 dark:bg-[#5b9fff]/10 dark:ring-[#5b9fff]/20"
                                        : "hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(option.value)}
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-[#0060f0] focus:ring-[#0060f0]/30"
                                />
                                <span className="min-w-0 flex-1 text-xs leading-snug text-gray-800 dark:text-[#E5E7EB]">
                                    {option.label}
                                    {option.count != null && (
                                        <span className="text-gray-400"> ({option.count})</span>
                                    )}
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>

            {hasMore && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="text-xs font-medium text-[#0060f0] hover:underline"
                >
                    {expanded ? "Vezi mai puțin" : "Vezi mai mult"}
                </button>
            )}
        </div>
    );
}

export default FilterCheckboxList;

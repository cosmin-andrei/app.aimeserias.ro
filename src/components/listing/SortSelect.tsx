"use client";

import {
    ArrowDownWideNarrow,
    ArrowUpWideNarrow,
    Clock,
    List,
    type LucideIcon,
} from "lucide-react";
import { ListingSelect, type ListingSelectOption } from "./ListingSelect";

export type SortSelectOption<T extends string = string> = ListingSelectOption<T>;

type SortSelectProps<T extends string> = {
    value: T;
    options: SortSelectOption<T>[];
    onChange: (value: T) => void;
    ariaLabel?: string;
};

const SORT_ICONS: Record<string, LucideIcon> = {
    default: List,
    newest: Clock,
    "budget-asc": ArrowUpWideNarrow,
    "budget-desc": ArrowDownWideNarrow,
};

function getSortIcon(value: string): LucideIcon {
    if (SORT_ICONS[value]) return SORT_ICONS[value];
    if (value.endsWith("-asc")) return ArrowUpWideNarrow;
    if (value.endsWith("-desc")) return ArrowDownWideNarrow;
    return Clock;
}

function SortIconBadge({ value, active }: { value: string; active: boolean }) {
    const Icon = getSortIcon(value);
    return (
        <Icon
            className={`h-3.5 w-3.5 shrink-0 ${
                active
                    ? "text-[#002050]/60 dark:text-white/70"
                    : "text-gray-400 dark:text-[#6B7280]"
            }`}
            aria-hidden
        />
    );
}

export function SortSelect<T extends string>({
    value,
    options,
    onChange,
    ariaLabel = "Mod ordonare",
}: SortSelectProps<T>) {
    return (
        <ListingSelect
            value={value}
            options={options}
            onChange={onChange}
            ariaLabel={ariaLabel}
            renderLeading={(option, active) => (
                <SortIconBadge value={option.value} active={active} />
            )}
        />
    );
}

export default SortSelect;

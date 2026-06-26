"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export type ListingSelectOption<T extends string = string> = {
    value: T;
    label: string;
    description?: string;
    count?: number;
};

type ListingSelectProps<T extends string> = {
    value: T;
    options: ListingSelectOption<T>[];
    onChange: (value: T) => void;
    ariaLabel?: string;
    renderLeading?: (option: ListingSelectOption<T>, active: boolean) => ReactNode;
};

export function ListingSelect<T extends string>({
    value,
    options,
    onChange,
    ariaLabel = "Selectează",
    renderLeading,
}: ListingSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const selected = options.find((opt) => opt.value === value) ?? options[0];

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    const handleSelect = (next: T) => {
        onChange(next);
        setOpen(false);
    };

    const defaultLeading = (active: boolean) => (
        <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                active ? "bg-[#0060f0] text-white" : "bg-[#0060f0]/10 text-[#0060f0]"
            }`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        </span>
    );

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-9 w-full items-center gap-2 rounded-lg border bg-white px-2.5 text-left transition-all dark:bg-[#0f0f11] ${
                    open
                        ? "border-[#0060f0] ring-2 ring-[#0060f0]/15 dark:border-[#5b9fff] dark:ring-[#5b9fff]/20"
                        : "border-gray-200 hover:border-[#002050]/20 hover:bg-[#fafcff] dark:border-white/[0.1] dark:hover:border-white/[0.18] dark:hover:bg-white/[0.04]"
                }`}
            >
                {renderLeading ? (
                    renderLeading(selected, true)
                ) : (
                    defaultLeading(true)
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-[#002050] sm:text-sm dark:text-white">
                        {selected.label}
                    </span>
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
                        open ? "rotate-180 text-[#0060f0]" : ""
                    }`}
                    aria-hidden
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    aria-label={ariaLabel}
                    className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-[#002050]/10 bg-white py-1 shadow-lg shadow-[#002050]/10 dark:border-white/[0.1] dark:bg-[#141414] dark:shadow-black/40"
                >
                    {options.map((option) => {
                        const active = option.value === value;

                        return (
                            <li key={option.value} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                                        active ? "bg-[#0060f0]/8 dark:bg-[#5b9fff]/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                                    }`}
                                >
                                    {renderLeading ? (
                                        renderLeading(option, active)
                                    ) : (
                                        defaultLeading(active)
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className={`block text-sm ${
                                                active
                                                    ? "font-semibold text-[#002050] dark:text-white"
                                                    : "font-medium text-gray-800 dark:text-[#E5E7EB]"
                                            }`}
                                        >
                                            {option.label}
                                            {option.count != null && (
                                                <span className="font-normal text-gray-400">
                                                    {" "}
                                                    ({option.count})
                                                </span>
                                            )}
                                        </span>
                                        {option.description && (
                                            <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-[#9CA3AF]">
                                                {option.description}
                                            </span>
                                        )}
                                    </span>
                                    {active && (
                                        <Check className="h-4 w-4 shrink-0 text-[#0060f0]" aria-hidden />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default ListingSelect;

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type ProjectViewMode = "all" | "mine" | "offered";

type ProjectViewTabsProps = {
    value: ProjectViewMode;
    onChange: (value: ProjectViewMode) => void;
};

const TAB_ITEMS: { value: ProjectViewMode; label: string }[] = [
    { value: "all", label: "Toate proiectele" },
    { value: "mine", label: "Proiectele mele" },
    { value: "offered", label: "Proiecte ofertate" },
];

type IndicatorState = {
    left: number;
    width: number;
    isFirst: boolean;
    isLast: boolean;
};

export function ProjectViewTabs({ value, onChange }: ProjectViewTabsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef(new Map<ProjectViewMode, HTMLButtonElement>());
    const [indicator, setIndicator] = useState<IndicatorState>({
        left: 0,
        width: 0,
        isFirst: true,
        isLast: false,
    });
    const [ready, setReady] = useState(false);

    const updateIndicator = useCallback(() => {
        const container = containerRef.current;
        const button = tabRefs.current.get(value);
        if (!container || !button) return;

        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const activeIndex = TAB_ITEMS.findIndex((tab) => tab.value === value);
        const isFirst = activeIndex === 0;
        const isLast = activeIndex === TAB_ITEMS.length - 1;

        let left = buttonRect.left - containerRect.left;
        let width = buttonRect.width;

        if (isFirst) left = 0;
        if (isLast) width = containerRect.width - left;

        setIndicator({ left, width, isFirst, isLast });
        setReady(true);
    }, [value]);

    useLayoutEffect(() => {
        updateIndicator();
    }, [updateIndicator]);

    useEffect(() => {
        window.addEventListener("resize", updateIndicator);
        return () => window.removeEventListener("resize", updateIndicator);
    }, [updateIndicator]);

    return (
        <div
            ref={containerRef}
            className="relative inline-flex h-9 max-w-full items-stretch overflow-hidden rounded-xl border border-stroke bg-white dark:border-white/[0.12] dark:bg-white/[0.08]"
            role="tablist"
            aria-label="Vizualizare proiecte"
        >
            <span
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-y-0 bg-[#16366d] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-[#f1f6ff]",
                    indicator.isFirst && indicator.isLast && "rounded-none",
                    indicator.isFirst && !indicator.isLast && "rounded-l-none rounded-r-lg",
                    !indicator.isFirst && indicator.isLast && "rounded-l-lg rounded-r-none",
                    !indicator.isFirst && !indicator.isLast && "rounded-lg",
                    ready ? "opacity-100" : "opacity-0"
                )}
                style={{
                    left: indicator.left,
                    width: indicator.width,
                }}
            />
            {TAB_ITEMS.map((tab) => {
                const active = value === tab.value;
                return (
                    <button
                        key={tab.value}
                        ref={(node) => {
                            if (node) tabRefs.current.set(tab.value, node);
                            else tabRefs.current.delete(tab.value);
                        }}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            "relative z-10 flex shrink-0 items-center px-2.5 text-xs font-medium transition-colors duration-200 sm:px-3 sm:text-sm",
                            active
                                ? "text-white dark:text-[#16366d]"
                                : "text-dark-5 hover:bg-black/[0.04] dark:text-[#9CA3AF] dark:hover:bg-white/[0.08]"
                        )}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

type AddProjectButtonProps = {
    href?: string;
};

export function AddProjectButton({ href = "/proiecte/adauga" }: AddProjectButtonProps) {
    return (
        <Link
            href={href}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-[#002050] transition-all hover:border-[#002050]/20 hover:bg-[#fafcff] sm:text-sm dark:border-white/[0.1] dark:bg-[#0f0f11] dark:text-white dark:hover:border-white/[0.18] dark:hover:bg-white/[0.04]"
        >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0060f0]/10 text-[#0060f0] dark:bg-[#5b9fff]/15 dark:text-[#5b9fff]">
                <Plus className="h-3 w-3" aria-hidden />
            </span>
            Adaugă proiect
        </Link>
    );
}

export default ProjectViewTabs;

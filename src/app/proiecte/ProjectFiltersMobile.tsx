"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    countActiveProjectFilters,
    DEFAULT_PROJECT_FILTERS,
    type ProjectFiltersState,
} from "@/lib/project";
import type { Project } from "@/types/project";
import { SlidersHorizontal, X } from "lucide-react";
import { ProjectFiltersForm } from "./ProjectFiltersForm";

type ProjectFiltersMobileProps = {
    filters: ProjectFiltersState;
    projects: Project[];
    onApply: (filters: ProjectFiltersState) => void;
    hideClientFilters?: boolean;
};

function FilterIcon({ active }: { active: boolean }) {
    return (
        <SlidersHorizontal
            className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                active
                    ? "text-[#0060f0] dark:text-[#5b9fff]"
                    : "text-gray-400 dark:text-[#6B7280]"
            }`}
            aria-hidden
        />
    );
}

export function ProjectFiltersMobile({
    filters,
    projects,
    onApply,
    hideClientFilters = false,
}: ProjectFiltersMobileProps) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [entered, setEntered] = useState(false);
    const [draft, setDraft] = useState(filters);
    const activeCount = countActiveProjectFilters(filters);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) setDraft(filters);
    }, [open, filters]);

    useEffect(() => {
        if (!open) {
            setEntered(false);
            return;
        }
        const t = requestAnimationFrame(() => {
            requestAnimationFrame(() => setEntered(true));
        });
        return () => cancelAnimationFrame(t);
    }, [open]);

    useEffect(() => {
        if (!closing) return;
        const t = setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, 160);
        return () => clearTimeout(t);
    }, [closing]);

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setClosing(true);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const handleOpen = () => {
        setClosing(false);
        setOpen(true);
    };

    const handleClose = () => setClosing(true);

    const handleApply = () => {
        onApply(draft);
        setClosing(true);
    };

    const handleReset = () => {
        setDraft(DEFAULT_PROJECT_FILTERS);
    };

    return (
        <>
            <button
                type="button"
                aria-label="Filtrează proiecte"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={handleOpen}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-white px-3 text-left transition-colors dark:bg-[#0f0f11] ${
                    open || activeCount > 0
                        ? "border-[#0060f0]/40 bg-[#fafcff] dark:border-[#5b9fff]/35 dark:bg-white/[0.04]"
                        : "border-gray-200 hover:border-[#002050]/15 hover:bg-[#fafcff] dark:border-white/[0.1] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.04]"
                }`}
            >
                <FilterIcon active={activeCount > 0 || open} />
                <span className="whitespace-nowrap text-xs font-medium text-[#002050] sm:text-sm dark:text-white">
                    Filtrează
                </span>
                {activeCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0060f0] px-1 text-[10px] font-semibold leading-none text-white dark:bg-[#5b9fff] dark:text-[#08080a]">
                        {activeCount}
                    </span>
                )}
            </button>

            {mounted &&
                open &&
                typeof document !== "undefined" &&
                createPortal(
                    <>
                        <div
                            className={`fixed inset-0 z-[130] bg-black/50 backdrop-blur-md ${
                                closing
                                    ? "animate-backdrop-exit"
                                    : entered
                                      ? "animate-backdrop-enter"
                                      : "opacity-0"
                            }`}
                            aria-hidden
                            onClick={handleClose}
                        />
                        <div className="pointer-events-none fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-6">
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-label="Filtre proiecte"
                                className={`pointer-events-auto flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#141414] dark:ring-1 dark:ring-white/[0.08] ${
                                    closing
                                        ? "animate-modal-exit"
                                        : entered
                                          ? "animate-modal-enter"
                                          : "pointer-events-none opacity-0"
                                }`}
                            >
                                <div className="flex shrink-0 items-center justify-between border-b border-stroke px-6 py-4 dark:border-white/[0.08]">
                                    <div className="flex items-center gap-2">
                                        <FilterIcon active={activeCount > 0} />
                                        <h2 className="text-base font-bold text-[#002050] dark:text-white">
                                            Filtrează
                                        </h2>
                                        {activeCount > 0 && (
                                            <span className="rounded-full bg-[#0060f0] px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-[#5b9fff] dark:text-[#08080a]">
                                                {activeCount}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50 dark:bg-white/[0.06] dark:text-[#9CA3AF] dark:ring-white/[0.1] dark:hover:bg-white/[0.1] dark:hover:text-white"
                                        aria-label="Închide"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="custom-scrollbar flex-1 overflow-y-auto">
                                    <ProjectFiltersForm
                                        filters={draft}
                                        onChange={setDraft}
                                        projects={projects}
                                        hideClientFilters={hideClientFilters}
                                    />
                                </div>

                                <div className="flex shrink-0 gap-3 border-t border-stroke px-6 py-4 dark:border-white/[0.08]">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="flex-1 rounded-xl border border-[#002050]/15 py-3 text-sm font-semibold text-[#002050] transition-colors hover:bg-[#fafcff] dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06]"
                                    >
                                        Resetează
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApply}
                                        className="flex-[1.4] rounded-xl bg-[#002050] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#001040] dark:bg-[#f1f6ff] dark:text-[#08080a] dark:hover:bg-white"
                                    >
                                        Aplică
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}

export default ProjectFiltersMobile;

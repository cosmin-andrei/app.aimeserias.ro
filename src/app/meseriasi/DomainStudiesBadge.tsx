"use client";

import { useEffect, useId, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";

const TOOLTIP_TEXT =
    "Meseriașul are studii sau calificări formale verificate pentru una sau mai multe specializări din profil. Acestea sunt evidențiate cu iconița de diplomă.";

export function DomainStudiesBadge() {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const tooltipId = useId();

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#002050]/8 px-3 py-1 text-xs font-semibold text-[#002050] transition-colors hover:bg-[#002050]/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0060f0]/40 dark:bg-white/[0.08] dark:text-[#c5d4f5] dark:hover:bg-white/[0.12]"
                aria-expanded={open}
                aria-describedby={open ? tooltipId : undefined}
            >
                <GraduationCap className="size-2.5" aria-hidden />
                Studii în domeniu
            </button>

            {open && (
                <div
                    id={tooltipId}
                    role="tooltip"
                    className="absolute left-1/2 top-full z-20 mt-2 w-[min(18rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-xl border border-[#002050]/10 bg-white p-3 text-center text-xs leading-relaxed text-gray-600 shadow-lg ring-1 ring-black/5 dark:border-white/[0.1] dark:bg-[#1a1a1c] dark:text-[#9CA3AF] dark:ring-white/[0.06] dark:shadow-black/40"
                >
                    {TOOLTIP_TEXT}
                </div>
            )}
        </div>
    );
}

export default DomainStudiesBadge;

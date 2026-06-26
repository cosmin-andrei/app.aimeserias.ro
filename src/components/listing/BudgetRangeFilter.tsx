"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatBudgetAmount, getProjectBudgetBounds } from "@/lib/project";

type BudgetRangeFilterProps = {
    min: string;
    max: string;
    onChange: (min: string, max: string) => void;
};

function clamp(value: number, low: number, high: number) {
    return Math.min(Math.max(value, low), high);
}

function parseBudgetInput(value: string, fallback: number): number {
    if (value.trim() === "") return fallback;
    const num = Number(value.replace(/\s/g, ""));
    return Number.isFinite(num) ? num : fallback;
}

function normalizeRange(rawMin: string, rawMax: string, bounds: { min: number; max: number }) {
    if (rawMin.trim() === "" && rawMax.trim() === "") {
        return { min: "", max: "" };
    }

    let lo = rawMin.trim() === "" ? bounds.min : Number(rawMin.replace(/\s/g, ""));
    let hi = rawMax.trim() === "" ? bounds.max : Number(rawMax.replace(/\s/g, ""));

    if (!Number.isFinite(lo)) lo = bounds.min;
    if (!Number.isFinite(hi)) hi = bounds.max;

    lo = clamp(lo, bounds.min, bounds.max);
    hi = clamp(hi, bounds.min, bounds.max);
    if (lo > hi) [lo, hi] = [hi, lo];

    if (lo <= bounds.min && hi >= bounds.max) {
        return { min: "", max: "" };
    }

    return { min: String(lo), max: String(hi) };
}

export function BudgetRangeFilter({ min, max, onChange }: BudgetRangeFilterProps) {
    const bounds = useMemo(() => getProjectBudgetBounds(), []);
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<"min" | "max" | null>(null);

    const sliderMin = parseBudgetInput(min, bounds.min);
    const sliderMax = parseBudgetInput(max, bounds.max);
    const safeMin = clamp(Math.min(sliderMin, sliderMax), bounds.min, bounds.max);
    const safeMax = clamp(Math.max(sliderMin, sliderMax), bounds.min, bounds.max);

    const span = bounds.max - bounds.min;
    const minPercent = span === 0 ? 0 : ((safeMin - bounds.min) / span) * 100;
    const maxPercent = span === 0 ? 100 : ((safeMax - bounds.min) / span) * 100;

    const valueFromClientX = useCallback(
        (clientX: number) => {
            const track = trackRef.current;
            if (!track) return bounds.min;
            const rect = track.getBoundingClientRect();
            const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
            const raw = bounds.min + ratio * span;
            return Math.round(raw / bounds.step) * bounds.step;
        },
        [bounds.min, bounds.step, span]
    );

    const applyRange = (nextMin: number, nextMax: number) => {
        const { min: lo, max: hi } = normalizeRange(String(nextMin), String(nextMax), bounds);
        onChange(lo, hi);
    };

    const handlePointerDown = (thumb: "min" | "max") => (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(thumb);
    };

    useEffect(() => {
        if (!dragging) return;

        const handleMove = (e: PointerEvent) => {
            const val = valueFromClientX(e.clientX);
            if (dragging === "min") {
                applyRange(Math.min(val, safeMax), safeMax);
            } else {
                applyRange(safeMin, Math.max(val, safeMin));
            }
        };

        const handleUp = () => setDragging(null);

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
        };
    }, [dragging, safeMin, safeMax, valueFromClientX]);

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).getAttribute("role") === "slider") return;
        const val = valueFromClientX(e.clientX);
        const distMin = Math.abs(val - safeMin);
        const distMax = Math.abs(val - safeMax);
        if (distMin <= distMax) {
            applyRange(Math.min(val, safeMax), safeMax);
        } else {
            applyRange(safeMin, Math.max(val, safeMin));
        }
    };

    const handleBlur = () => {
        const { min: lo, max: hi } = normalizeRange(min, max, bounds);
        onChange(lo, hi);
    };

    return (
        <div className="space-y-3">
            <div
                ref={trackRef}
                className="relative mx-1 h-8 cursor-pointer select-none"
                onClick={handleTrackClick}
            >
                <div className="absolute left-0 right-0 top-1/2 z-0 h-1.5 -translate-y-1/2 rounded-full bg-gray-200 dark:bg-white/[0.12]" />
                <div
                    className="absolute top-1/2 z-[1] h-1.5 -translate-y-1/2 rounded-full bg-[#0060f0]"
                    style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                />

                <div
                    role="slider"
                    aria-label="Buget minim"
                    aria-valuemin={bounds.min}
                    aria-valuemax={bounds.max}
                    aria-valuenow={safeMin}
                    tabIndex={0}
                    onPointerDown={handlePointerDown("min")}
                    className={`absolute top-1/2 z-20 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0060f0] shadow-md touch-none active:cursor-grabbing ${dragging === "min" ? "scale-110" : "hover:scale-105"}`}
                    style={{ left: `${minPercent}%` }}
                />
                <div
                    role="slider"
                    aria-label="Buget maxim"
                    aria-valuemin={bounds.min}
                    aria-valuemax={bounds.max}
                    aria-valuenow={safeMax}
                    tabIndex={0}
                    onPointerDown={handlePointerDown("max")}
                    className={`absolute top-1/2 z-20 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0060f0] shadow-md touch-none active:cursor-grabbing ${dragging === "max" ? "scale-110" : "hover:scale-105"}`}
                    style={{ left: `${maxPercent}%` }}
                />
            </div>

            <div className="flex justify-between px-1 text-[10px] text-gray-400 dark:text-[#9CA3AF]">
                <span>{formatBudgetAmount(bounds.min)}</span>
                <span>{formatBudgetAmount(bounds.max)} RON</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-[#9CA3AF]">De la</label>
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50/80 focus-within:border-[#0060f0] focus-within:ring-2 focus-within:ring-[#0060f0]/15 dark:border-white/[0.12] dark:bg-white/[0.04] dark:focus-within:border-[#5b9fff] dark:focus-within:ring-[#5b9fff]/20">
                        <input
                            type="number"
                            inputMode="numeric"
                            min={bounds.min}
                            max={bounds.max}
                            step={bounds.step}
                            placeholder={formatBudgetAmount(bounds.min)}
                            value={min}
                            onChange={(e) => onChange(e.target.value, max)}
                            onBlur={handleBlur}
                            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-gray-900 outline-none dark:text-white dark:placeholder:text-[#6B7280]"
                        />
                        <span className="flex items-center border-l border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-400 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
                            RON
                        </span>
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-[#9CA3AF]">Până la</label>
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50/80 focus-within:border-[#0060f0] focus-within:ring-2 focus-within:ring-[#0060f0]/15 dark:border-white/[0.12] dark:bg-white/[0.04] dark:focus-within:border-[#5b9fff] dark:focus-within:ring-[#5b9fff]/20">
                        <input
                            type="number"
                            inputMode="numeric"
                            min={bounds.min}
                            max={bounds.max}
                            step={bounds.step}
                            placeholder={formatBudgetAmount(bounds.max)}
                            value={max}
                            onChange={(e) => onChange(min, e.target.value)}
                            onBlur={handleBlur}
                            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-gray-900 outline-none dark:text-white dark:placeholder:text-[#6B7280]"
                        />
                        <span className="flex items-center border-l border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-400 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
                            RON
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BudgetRangeFilter;

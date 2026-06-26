"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReportReason } from "@/lib/messaging";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: "spam", label: "Spam sau mesaje nedorite" },
    { value: "harassment", label: "Hărțuire" },
    { value: "fraud", label: "Înșelăciune sau fraudă" },
    { value: "inappropriate", label: "Conținut nepotrivit" },
    { value: "other", label: "Alt motiv" },
];

const CLOSE_ANIMATION_MS = 160;

type ReportDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reason: ReportReason;
    details: string;
    submitting: boolean;
    onReasonChange: (reason: ReportReason) => void;
    onDetailsChange: (details: string) => void;
    onSubmit: () => void;
};

export function ReportDialog({
    open,
    onOpenChange,
    reason,
    details,
    submitting,
    onReasonChange,
    onDetailsChange,
    onSubmit,
}: ReportDialogProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [entered, setEntered] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const finishClose = useCallback(() => {
        setClosing(false);
        setEntered(false);
        setVisible(false);
        onOpenChange(false);
    }, [onOpenChange]);

    const requestClose = useCallback(() => {
        if (closing || submitting) return;
        setClosing(true);
    }, [closing, submitting]);

    useEffect(() => {
        if (open) {
            setVisible(true);
            setClosing(false);
            const frame = requestAnimationFrame(() => {
                requestAnimationFrame(() => setEntered(true));
            });
            return () => cancelAnimationFrame(frame);
        }

        if (visible && !closing) {
            setClosing(true);
        }
    }, [open, visible, closing]);

    useEffect(() => {
        if (!closing) return;
        const timeout = window.setTimeout(() => finishClose(), CLOSE_ANIMATION_MS);
        return () => window.clearTimeout(timeout);
    }, [closing, finishClose]);

    useEffect(() => {
        if (!visible || closing) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [visible, closing, requestClose]);

    if (!mounted || !visible) return null;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm ${
                    closing
                        ? "animate-backdrop-exit"
                        : entered
                          ? "animate-backdrop-enter"
                          : "opacity-0"
                }`}
                aria-hidden
                onClick={requestClose}
            />
            <div className="pointer-events-none fixed inset-0 z-[140] flex items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="report-dialog-title"
                    className={`pointer-events-auto w-full max-w-[26rem] overflow-hidden rounded-2xl border border-stroke bg-white text-dark shadow-2xl dark:border-white/[0.08] dark:bg-[#1a1a1c] dark:text-white ${
                        closing
                            ? "animate-modal-exit"
                            : entered
                              ? "animate-modal-enter"
                              : "pointer-events-none opacity-0"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                >
                    <form
                        className="flex flex-col"
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                    >
                        <div className="border-b border-stroke px-5 py-4 dark:border-white/[0.08]">
                            <h2 id="report-dialog-title" className="text-base font-semibold">
                                Raportează meseriașul
                            </h2>
                            <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
                                Echipa noastră va analiza sesizarea în cel mai scurt timp.
                            </p>
                        </div>
                        <div className="space-y-4 px-5 py-4">
                            <div>
                                <label
                                    htmlFor="report-reason"
                                    className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                >
                                    Motiv
                                </label>
                                <select
                                    id="report-reason"
                                    value={reason}
                                    onChange={(e) => onReasonChange(e.target.value as ReportReason)}
                                    className="h-10 w-full rounded-xl border border-stroke bg-white px-3 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                >
                                    {REPORT_REASONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="report-details"
                                    className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                >
                                    Detalii {reason === "other" ? "(obligatoriu)" : "(opțional)"}
                                </label>
                                <textarea
                                    id="report-details"
                                    value={details}
                                    onChange={(e) => onDetailsChange(e.target.value)}
                                    rows={4}
                                    placeholder="Descrie pe scurt situația…"
                                    className="w-full resize-none rounded-xl border border-stroke bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-stroke px-5 py-4 dark:border-white/[0.08]">
                            <button
                                type="button"
                                onClick={requestClose}
                                disabled={submitting}
                                className="rounded-xl px-4 py-2 text-sm text-dark-5 hover:bg-gray-1 disabled:opacity-50 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06]"
                            >
                                Anulează
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-xl bg-[#16366d] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#f1f6ff] dark:text-[#16366d]"
                            >
                                {submitting ? "Se trimite…" : "Trimite raportul"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
}

export function useAutoDismiss(message: string | null, onDismiss: () => void, ms = 4500) {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(onDismiss, ms);
        return () => clearTimeout(timer);
    }, [message, onDismiss, ms]);
}

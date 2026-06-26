"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Wrench } from "lucide-react";
import {
    buildIsoFromDateAndTime,
    toDateKey,
} from "@/lib/worker-calendar";
import {
    createMaintenanceProposal,
    listMaintenanceEligibleJobs,
    type MaintenanceEligibleJob,
} from "@/lib/maintenance-proposal";

const CLOSE_ANIMATION_MS = 160;

type MaintenanceProposalModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationId: number;
    onCreated: () => void;
    onError: (message: string) => void;
};

function defaultEndTime(startTime: string): string {
    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + (m || 0) + 60;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function MaintenanceProposalModal({
    open,
    onOpenChange,
    conversationId,
    onCreated,
    onError,
}: MaintenanceProposalModalProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [entered, setEntered] = useState(false);
    const [closing, setClosing] = useState(false);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [jobs, setJobs] = useState<MaintenanceEligibleJob[]>([]);
    const [mode, setMode] = useState<"project" | "manual">("manual");
    const [jobId, setJobId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [materials, setMaterials] = useState("");
    const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
    const [startTime, setStartTime] = useState("10:00");
    const [endTime, setEndTime] = useState("11:00");

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

    useEffect(() => {
        if (!open) return;

        setLoadingJobs(true);
        void listMaintenanceEligibleJobs(conversationId).then(({ data, error }) => {
            setLoadingJobs(false);
            if (error) {
                onError(error);
                return;
            }
            const list = data ?? [];
            setJobs(list);
            if (list.length > 0) {
                setMode("project");
                setJobId(String(list[0]!.id));
                setTitle(list[0]!.title);
                setDescription(list[0]!.description || "");
                setLocation(list[0]!.city || "");
            } else {
                setMode("manual");
            }
        });
    }, [open, conversationId, onError]);

    useEffect(() => {
        if (mode !== "project" || !jobId) return;
        const job = jobs.find((item) => String(item.id) === jobId);
        if (!job) return;
        setTitle(job.title);
        setDescription(job.description || "");
        if (!location.trim()) setLocation(job.city || "");
    }, [mode, jobId, jobs, location]);

    const handleStartTimeChange = (value: string) => {
        setStartTime(value);
        setEndTime(defaultEndTime(value));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (submitting) return;

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            onError("Titlul este obligatoriu.");
            return;
        }

        setSubmitting(true);
        const result = await createMaintenanceProposal(conversationId, {
            title: trimmedTitle,
            starts_at: buildIsoFromDateAndTime(dateKey, startTime),
            ends_at: buildIsoFromDateAndTime(dateKey, endTime),
            job_id: mode === "project" && jobId ? Number(jobId) : null,
            description: description.trim() || undefined,
            location: location.trim() || undefined,
            materials: materials.trim() || undefined,
        });
        setSubmitting(false);

        if (!result.data) {
            onError(result.error || "Programarea nu a putut fi trimisă.");
            return;
        }

        onCreated();
        setClosing(true);
    };

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
                    aria-labelledby="maintenance-modal-title"
                    className={`pointer-events-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stroke bg-white text-dark shadow-2xl dark:border-white/[0.08] dark:bg-[#1a1a1c] dark:text-white ${
                        closing
                            ? "animate-modal-exit"
                            : entered
                              ? "animate-modal-enter"
                              : "pointer-events-none opacity-0"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                >
                    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col">
                        <div className="border-b border-stroke px-5 py-4 dark:border-white/[0.08]">
                            <div className="flex items-center gap-2">
                                <Wrench className="size-5 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                                <h2 id="maintenance-modal-title" className="text-base font-semibold">
                                    Programare mentenanță / reparație
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
                                Clientul va primi propunerea în chat și o poate accepta sau refuza.
                            </p>
                        </div>

                        <div className="space-y-4 px-5 py-4">
                            {loadingJobs ? (
                                <div className="flex items-center gap-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                    Se încarcă proiectele…
                                </div>
                            ) : jobs.length > 0 ? (
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                                        Sursă
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMode("project")}
                                            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                                                mode === "project"
                                                    ? "border-[#0060f0] bg-[#0060f0]/10 text-[#0060f0] dark:border-[#5b9fff] dark:bg-[#5b9fff]/10 dark:text-[#5b9fff]"
                                                    : "border-stroke text-dark-5 hover:bg-gray-1 dark:border-white/[0.1] dark:text-[#9CA3AF] dark:hover:bg-white/[0.06]"
                                            }`}
                                        >
                                            Proiect câștigat
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode("manual")}
                                            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                                                mode === "manual"
                                                    ? "border-[#0060f0] bg-[#0060f0]/10 text-[#0060f0] dark:border-[#5b9fff] dark:bg-[#5b9fff]/10 dark:text-[#5b9fff]"
                                                    : "border-stroke text-dark-5 hover:bg-gray-1 dark:border-white/[0.1] dark:text-[#9CA3AF] dark:hover:bg-white/[0.06]"
                                            }`}
                                        >
                                            Detalii manuale
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {mode === "project" && jobs.length > 0 && (
                                <div>
                                    <label
                                        htmlFor="maintenance-job"
                                        className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                    >
                                        Proiect
                                    </label>
                                    <select
                                        id="maintenance-job"
                                        value={jobId}
                                        onChange={(e) => setJobId(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-stroke bg-white px-3 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    >
                                        {jobs.map((job) => (
                                            <option key={job.id} value={job.id}>
                                                {job.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="maintenance-title"
                                    className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                >
                                    Titlu
                                </label>
                                <input
                                    id="maintenance-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-stroke bg-white px-3 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    placeholder="Ex: Reparație instalație"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="sm:col-span-1">
                                    <label
                                        htmlFor="maintenance-date"
                                        className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                    >
                                        Data
                                    </label>
                                    <input
                                        id="maintenance-date"
                                        type="date"
                                        value={dateKey}
                                        onChange={(e) => setDateKey(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-stroke bg-white px-3 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="maintenance-start"
                                        className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                    >
                                        De la
                                    </label>
                                    <input
                                        id="maintenance-start"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => handleStartTimeChange(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-stroke bg-white px-3 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="maintenance-end"
                                        className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                    >
                                        Până la
                                    </label>
                                    <input
                                        id="maintenance-end"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-stroke bg-white px-3 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="maintenance-location"
                                    className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                >
                                    Locație
                                </label>
                                <input
                                    id="maintenance-location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-stroke bg-white px-3 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    placeholder="Adresă sau oraș"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="maintenance-description"
                                    className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                >
                                    Detalii lucrare
                                </label>
                                <textarea
                                    id="maintenance-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-stroke bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    placeholder="Descrie pe scurt intervenția…"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="maintenance-materials"
                                    className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]"
                                >
                                    Materiale (opțional)
                                </label>
                                <textarea
                                    id="maintenance-materials"
                                    value={materials}
                                    onChange={(e) => setMaterials(e.target.value)}
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-stroke bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0060f0] dark:border-white/[0.1] dark:bg-[#0c0c0e]"
                                    placeholder="Materiale necesare sau aduse de client…"
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
                                {submitting ? "Se trimite…" : "Trimite clientului"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
}

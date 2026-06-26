"use client";

import { Download, FileText, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchMessageAttachment, type MessageItem } from "@/lib/messaging";

type MessageAttachmentPopupProps = {
    message: MessageItem;
    onClose: () => void;
};

function isPdfAttachment(message: MessageItem): boolean {
    const name = message.attachment_original_name?.toLowerCase() || "";
    const mime = message.attachment_mime?.toLowerCase() || "";
    return name.endsWith(".pdf") || mime === "application/pdf";
}

function isWordAttachment(message: MessageItem): boolean {
    const name = message.attachment_original_name?.toLowerCase() || "";
    const mime = message.attachment_mime?.toLowerCase() || "";
    return (
        name.endsWith(".doc") ||
        name.endsWith(".docx") ||
        mime === "application/msword" ||
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
}

const CLOSE_ANIMATION_MS = 160;

export function MessageAttachmentPopup({ message, onClose }: MessageAttachmentPopupProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [entered, setEntered] = useState(false);
    const [closing, setClosing] = useState(false);

    const fileName = message.attachment_original_name || "Atașament";
    const isImage = message.message_type === "image";
    const isPdf = isPdfAttachment(message);
    const isWord = isWordAttachment(message);

    const requestClose = useCallback(() => {
        if (closing) return;
        setClosing(true);
    }, [closing]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [requestClose]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            requestAnimationFrame(() => setEntered(true));
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!closing) return;
        const timeout = window.setTimeout(() => onClose(), CLOSE_ANIMATION_MS);
        return () => window.clearTimeout(timeout);
    }, [closing, onClose]);

    useEffect(() => {
        let objectUrl: string | null = null;
        setLoading(true);
        setError(null);

        void fetchMessageAttachment(message.conversation_id, message.id).then(({ blob, error: fetchError }) => {
            setLoading(false);
            if (!blob || fetchError) {
                setError(fetchError || "Nu s-a putut încărca fișierul.");
                return;
            }
            objectUrl = URL.createObjectURL(blob);
            setBlobUrl(objectUrl);
        });

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [message.conversation_id, message.id]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm ${
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
                        aria-label={isImage ? "Imagine" : fileName}
                        className={`pointer-events-auto flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl ${
                            isImage ? "bg-black" : "bg-white dark:bg-[#1a1a1c] dark:ring-1 dark:ring-white/[0.08]"
                        } ${
                            closing
                                ? "animate-modal-exit"
                                : entered
                                  ? "animate-modal-enter"
                                  : "pointer-events-none opacity-0"
                        }`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {isImage ? (
                            <div className="relative flex min-h-[12rem] flex-1 items-center justify-center overflow-auto bg-black/90 p-2 sm:p-4">
                                <div className="absolute right-2 top-2 z-10 flex items-center gap-1 sm:right-3 sm:top-3">
                                    {blobUrl && (
                                        <a
                                            href={blobUrl}
                                            download={fileName}
                                            className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
                                            aria-label="Descarcă imaginea"
                                        >
                                            <Download className="size-4" />
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={requestClose}
                                        className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
                                        aria-label="Închide"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="flex flex-col items-center gap-2 text-white/70">
                                        <Loader2 className="size-8 animate-spin" aria-hidden />
                                        <p className="text-sm">Se încarcă…</p>
                                    </div>
                                ) : error ? (
                                    <p className="max-w-sm px-4 text-center text-sm text-red-200">{error}</p>
                                ) : blobUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={blobUrl}
                                        alt=""
                                        className="max-h-[85vh] max-w-full rounded-lg object-contain"
                                    />
                                ) : null}
                            </div>
                        ) : (
                            <>
                                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stroke/80 px-4 py-3 dark:border-white/[0.08]">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-dark dark:text-white">
                                            {fileName}
                                        </p>
                                        <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
                                            {isPdf ? "Document PDF" : isWord ? "Document Word" : "Document"}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {blobUrl && (
                                            <a
                                                href={blobUrl}
                                                download={fileName}
                                                className="flex size-9 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-1 dark:text-[#9CA3AF] dark:hover:bg-white/10"
                                                aria-label="Descarcă fișierul"
                                            >
                                                <Download className="size-4" />
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={requestClose}
                                            className="flex size-9 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-1 dark:text-[#9CA3AF] dark:hover:bg-white/10"
                                            aria-label="Închide"
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex min-h-[12rem] flex-1 items-center justify-center overflow-auto bg-gray-1/40 p-4 dark:bg-black/30">
                                    {loading ? (
                                        <div className="flex flex-col items-center gap-2 text-dark-5 dark:text-[#9CA3AF]">
                                            <Loader2 className="size-8 animate-spin" aria-hidden />
                                            <p className="text-sm">Se încarcă…</p>
                                        </div>
                                    ) : error ? (
                                        <p className="max-w-sm text-center text-sm text-red">{error}</p>
                                    ) : isPdf && blobUrl ? (
                                        <iframe
                                            title={fileName}
                                            src={blobUrl}
                                            className="h-[70vh] w-full rounded-lg border border-stroke/60 bg-white dark:border-white/[0.08]"
                                        />
                                    ) : (
                                        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                                            <span className="flex size-16 items-center justify-center rounded-2xl bg-[#0060f0]/10 text-[#0060f0] dark:bg-[#5b9fff]/15 dark:text-[#5b9fff]">
                                                <FileText className="size-8" aria-hidden />
                                            </span>
                                            <div>
                                                <p className="font-medium text-dark dark:text-white">{fileName}</p>
                                                <p className="mt-1 text-sm text-dark-5 dark:text-[#9CA3AF]">
                                                    {isWord
                                                        ? "Previzualizarea Word nu este disponibilă în browser. Poți descărca documentul."
                                                        : "Previzualizarea nu este disponibilă. Poți descărca fișierul."}
                                                </p>
                                            </div>
                                            {blobUrl && (
                                                <a
                                                    href={blobUrl}
                                                    download={fileName}
                                                    className="inline-flex items-center gap-2 rounded-full bg-[#16366d] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-[#f1f6ff] dark:text-[#16366d]"
                                                >
                                                    <Download className="size-4" />
                                                    Descarcă documentul
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
            </div>
        </>,
        document.body
    );
}

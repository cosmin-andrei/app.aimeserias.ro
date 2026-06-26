"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { ImageIcon, Paperclip, Send, X } from "lucide-react";
import { MESSAGE_DOCUMENT_ACCEPT, MESSAGE_FILE_ACCEPT } from "@/lib/messaging";
import { cn } from "@/lib/utils";

type MessageComposerProps = {
    draft: string;
    onDraftChange: (value: string) => void;
    pendingFile: File | null;
    onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
    onClearFile: () => void;
    onSend: () => void;
    sending: boolean;
    disabled?: boolean;
};

const ACTION_BTN =
    "flex size-8 shrink-0 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-1 disabled:opacity-40 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06]";

export function MessageComposer({
    draft,
    onDraftChange,
    pendingFile,
    onFileSelect,
    onClearFile,
    onSend,
    sending,
    disabled = false,
}: MessageComposerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewUrl = pendingFile?.type.startsWith("image/")
        ? URL.createObjectURL(pendingFile)
        : null;

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "32px";
        if (draft.trim()) {
            el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
        }
    }, [draft]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const canSend = Boolean(draft.trim() || pendingFile) && !sending && !disabled;

    return (
        <div className="shrink-0 border-t border-stroke/80 bg-white/90 px-3 py-2 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#121214]/90">
            {pendingFile && (
                <div className="mb-2 flex items-start gap-2 rounded-xl border border-stroke/70 bg-gray-1/60 p-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
                    {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={previewUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-white/[0.06]">
                            <Paperclip className="size-4 text-dark-5 dark:text-[#9CA3AF]" aria-hidden />
                        </div>
                    )}
                    <div className="min-w-0 flex-1 pt-0.5">
                        <p className="truncate text-xs font-medium text-dark dark:text-white">
                            {pendingFile.name}
                        </p>
                        <p className="text-[11px] text-dark-5 dark:text-[#9CA3AF]">
                            {(pendingFile.size / 1024).toFixed(0)} KB
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClearFile}
                        className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-white dark:text-[#9CA3AF] dark:hover:bg-white/[0.08]"
                        aria-label="Elimină fișierul"
                    >
                        <X className="size-3.5" aria-hidden />
                    </button>
                </div>
            )}

            <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (canSend) onSend();
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={MESSAGE_FILE_ACCEPT}
                    className="hidden"
                    onChange={onFileSelect}
                />

                <button
                    type="button"
                    onClick={() => {
                        if (fileInputRef.current) {
                            fileInputRef.current.accept = MESSAGE_DOCUMENT_ACCEPT;
                            fileInputRef.current.click();
                            fileInputRef.current.accept = MESSAGE_FILE_ACCEPT;
                        }
                    }}
                    disabled={sending || disabled}
                    className={ACTION_BTN}
                    aria-label="Atașează document PDF sau Word"
                >
                    <Paperclip className="size-4" aria-hidden />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (fileInputRef.current) {
                            fileInputRef.current.accept = "image/*";
                            fileInputRef.current.click();
                            fileInputRef.current.accept = MESSAGE_FILE_ACCEPT;
                        }
                    }}
                    disabled={sending || disabled}
                    className={ACTION_BTN}
                    aria-label="Atașează poză"
                >
                    <ImageIcon className="size-4" aria-hidden />
                </button>

                <div className="flex h-8 min-w-0 flex-1 items-center rounded-full border border-stroke/80 bg-gray-1/40 px-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        rows={1}
                        disabled={disabled}
                        placeholder="Scrie un mesaj…"
                        className="max-h-24 min-h-8 w-full resize-none bg-transparent py-1.5 text-sm leading-5 text-dark outline-none placeholder:text-dark-5/70 disabled:opacity-50 dark:text-white dark:placeholder:text-[#6B7280]"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (canSend) onSend();
                            }
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!canSend}
                    className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full transition-all",
                        canSend
                            ? "bg-[#16366d] text-white shadow-sm hover:opacity-90 dark:bg-[#f1f6ff] dark:text-[#16366d]"
                            : "bg-stroke/50 text-dark-5 dark:bg-white/[0.06] dark:text-[#6B7280]"
                    )}
                    aria-label="Trimite mesaj"
                >
                    <Send className="size-3.5" aria-hidden />
                </button>
            </form>
        </div>
    );
}

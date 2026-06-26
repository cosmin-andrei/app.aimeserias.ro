"use client";

import { FileText, ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMessageAttachment, type MessageItem } from "@/lib/messaging";
import { cn } from "@/lib/utils";
import { MessageAttachmentPopup } from "./message-attachment-popup";

type MessageAttachmentViewProps = {
    message: MessageItem;
    isMine: boolean;
};

export function MessageAttachmentView({ message, isMine }: MessageAttachmentViewProps) {
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);
    const [loadingThumb, setLoadingThumb] = useState(message.message_type === "image");
    const [popupOpen, setPopupOpen] = useState(false);

    const isImage = message.message_type === "image";
    const isDocument = message.message_type === "document";
    const fileName = message.attachment_original_name || (isImage ? "Poză" : "Document");

    useEffect(() => {
        if (!isImage || message.id <= 0) return;

        let objectUrl: string | null = null;
        setLoadingThumb(true);

        void fetchMessageAttachment(message.conversation_id, message.id).then(({ blob, error }) => {
            setLoadingThumb(false);
            if (!blob || error) return;
            objectUrl = URL.createObjectURL(blob);
            setThumbUrl(objectUrl);
        });

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [isImage, message.conversation_id, message.id]);

    if (!isImage && !isDocument) return null;

    const triggerClass = cn(
        "mb-2 block w-full text-left transition-opacity hover:opacity-90",
        isDocument &&
            cn(
                "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium",
                isMine
                    ? "border-white/20 bg-white/10"
                    : "border-stroke bg-gray-1/50 dark:border-white/[0.1] dark:bg-white/[0.04]"
            ),
        isImage && "overflow-hidden rounded-xl"
    );

    return (
        <>
            <button type="button" onClick={() => setPopupOpen(true)} className={triggerClass}>
                {isImage ? (
                    loadingThumb ? (
                        <div className="flex h-40 max-h-56 items-center justify-center bg-black/5 dark:bg-white/[0.04]">
                            <Loader2 className="size-6 animate-spin text-dark-5 dark:text-[#9CA3AF]" />
                        </div>
                    ) : thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={thumbUrl}
                            alt={fileName}
                            className="max-h-56 max-w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-40 max-h-56 flex-col items-center justify-center gap-2 bg-black/5 text-dark-5 dark:bg-white/[0.04] dark:text-[#9CA3AF]">
                            <ImageIcon className="size-6" aria-hidden />
                            <span className="text-xs">Poză</span>
                        </div>
                    )
                ) : (
                    <>
                        <FileText className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{fileName}</span>
                    </>
                )}
            </button>

            {popupOpen && (
                <MessageAttachmentPopup message={message} onClose={() => setPopupOpen(false)} />
            )}
        </>
    );
}

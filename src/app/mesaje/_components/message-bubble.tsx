"use client";

import { memo } from "react";
import { Check, Eye } from "lucide-react";
import { formatMessageTime } from "@/lib/format-message-time";
import type { MessageItem } from "@/lib/messaging";
import { cn } from "@/lib/utils";
import { MessageAttachmentView } from "./message-attachment-view";

type MessageBubbleProps = {
    message: MessageItem;
    isMine: boolean;
    isPending?: boolean;
};

export const MessageBubble = memo(function MessageBubble({
    message,
    isMine,
    isPending = false,
}: MessageBubbleProps) {
    const hasAttachment =
        message.message_type === "image" || message.message_type === "document";
    const isSeen = Boolean(message.read_at);

    return (
        <div
            className={cn(
                "max-w-[min(85%,20rem)] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm transition-opacity",
                isMine
                    ? "rounded-br-md bg-gradient-to-br from-[#16366d] to-[#1e4485] text-white dark:from-[#e8f0ff] dark:to-[#f1f6ff] dark:text-[#16366d]"
                    : "rounded-bl-md border border-stroke/60 bg-white text-dark dark:border-white/[0.08] dark:bg-[#1a1a1c] dark:text-[#E5E7EB]",
                isPending && "opacity-70"
            )}
        >
            {hasAttachment && (
                <MessageAttachmentView message={message} isMine={isMine} />
            )}
            {message.body?.trim() && (
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}
            <div
                className={cn(
                    "mt-1 flex items-center justify-end gap-1",
                    isMine
                        ? "text-white/65 dark:text-[#16366d]/55"
                        : "text-dark-5 dark:text-[#9CA3AF]"
                )}
            >
                <time className="text-[10px]" dateTime={message.created_at}>
                    {formatMessageTime(message.created_at)}
                </time>
                {isMine && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5",
                            isSeen && "text-sky-200 dark:text-[#0060f0]/80"
                        )}
                        title={
                            isSeen
                                ? "Văzut"
                                : isPending
                                  ? "Se trimite"
                                  : "Trimis"
                        }
                        aria-label={
                            isSeen
                                ? "Văzut"
                                : isPending
                                  ? "Se trimite"
                                  : "Trimis"
                        }
                    >
                        {isSeen ? (
                            <Eye className="size-3.5" aria-hidden />
                        ) : (
                            <Check
                                className={cn("size-3.5", isPending && "opacity-60")}
                                aria-hidden
                            />
                        )}
                    </span>
                )}
            </div>
        </div>
    );
});

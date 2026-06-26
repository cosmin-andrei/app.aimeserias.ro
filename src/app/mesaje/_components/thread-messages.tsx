"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/lib/messaging";
import { groupMessagesByDate } from "../_lib/message-utils";
import { MessageBubble } from "./message-bubble";
import { MaintenanceProposalBubble } from "./maintenance-proposal-bubble";

type ThreadMessagesProps = {
    messages: MessageItem[];
    currentUserId: number | null;
    isClientUser: boolean;
    loading: boolean;
    pendingIds: Set<number>;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
    onProposalUpdated: () => void;
    onProposalError: (message: string) => void;
};

function ThreadSkeleton() {
    return (
        <div className="space-y-4 px-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                    <Skeleton className={cnBubble(i % 2 !== 0)} />
                </div>
            ))}
        </div>
    );
}

function cnBubble(isMine: boolean) {
    return isMine ? "h-14 w-48 rounded-2xl rounded-br-md" : "h-12 w-56 rounded-2xl rounded-bl-md";
}

export function ThreadMessages({
    messages,
    currentUserId,
    isClientUser,
    loading,
    pendingIds,
    scrollContainerRef,
    messagesEndRef,
    onScroll,
    onProposalUpdated,
    onProposalError,
}: ThreadMessagesProps) {
    const groups = groupMessagesByDate(messages);

    return (
        <div
            ref={scrollContainerRef}
            onScroll={onScroll}
            className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.5)_0%,rgba(255,255,255,0)_100%)] px-3 py-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0)_100%)]"
            style={{
                backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(0,32,80,0.04) 1px, transparent 0)",
                backgroundSize: "24px 24px",
            }}
        >
            {loading ? (
                <ThreadSkeleton />
            ) : messages.length === 0 ? (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center text-center">
                    <p className="text-sm font-medium text-dark dark:text-white">
                        Începe conversația
                    </p>
                    <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
                        Trimite primul mesaj mai jos.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {groups.map((group) => (
                        <section key={group.label}>
                            <div className="mb-3 flex justify-center">
                                <span className="rounded-full border border-stroke/60 bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-dark-5 shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#1a1a1c]/90 dark:text-[#9CA3AF]">
                                    {group.label}
                                </span>
                            </div>
                            <ul className="space-y-2">
                                {group.messages.map((message) => {
                                    const isMine =
                                        currentUserId != null &&
                                        message.sender_user_id === currentUserId;

                                    if (
                                        message.message_type === "maintenance_proposal" &&
                                        message.maintenance_proposal
                                    ) {
                                        return (
                                            <li key={message.id} className="flex justify-center">
                                                <MaintenanceProposalBubble
                                                    proposal={message.maintenance_proposal}
                                                    createdAt={message.created_at}
                                                    isClient={isClientUser}
                                                    onUpdated={onProposalUpdated}
                                                    onError={onProposalError}
                                                />
                                            </li>
                                        );
                                    }

                                    return (
                                        <li
                                            key={message.id}
                                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                        >
                                            <MessageBubble
                                                message={message}
                                                isMine={isMine}
                                                isPending={pendingIds.has(message.id)}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
            <div ref={messagesEndRef} className="h-px" />
        </div>
    );
}

export function SendingIndicator({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
        <div className="flex items-center gap-1.5 px-4 py-1 text-[11px] text-dark-5 dark:text-[#9CA3AF]">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Se trimite…
        </div>
    );
}

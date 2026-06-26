"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { getProfilePictureUrl } from "@/lib/api-client";
import {
    blockUser,
    findOrCreateConversation,
    getConversationMessages,
    getMessagePreview,
    listConversations,
    reportUser,
    sendMessage,
    sendMessageAttachment,
    unblockUser,
    validateMessageFile,
    type ConversationItem,
    type MessageItem,
    type ReportReason,
} from "@/lib/messaging";
import { cn } from "@/lib/utils";
import { pageWidthClass } from "@/lib/page-layout";
import { normalizeUserRole } from "@/lib/site";
import { ConversationSidebar } from "./_components/conversation-sidebar";
import {
    BlockedBanner,
    ConversationHeader,
    EmptyThreadPlaceholder,
} from "./_components/conversation-header";
import { MessageComposer } from "./_components/message-composer";
import { ReportDialog, useAutoDismiss } from "./_components/report-dialog";
import { MaintenanceProposalModal } from "./_components/maintenance-proposal-modal";
import { SendingIndicator, ThreadMessages } from "./_components/thread-messages";
import { ToastBanner } from "./_components/toast-banner";
import { matchesConversationSearch, mergeThreadMessages, THREAD_POLL_MS } from "./_lib/message-utils";

type ListFilter = "all" | "unread";

function getParticipantAvatar(user: ConversationItem["other_user"]) {
    if (!user?.profile_picture) return null;
    return getProfilePictureUrl(user.profile_picture);
}

function getWorkerProfileHref(user: ConversationItem["other_user"]): string | null {
    if (!user?.worker_id) return null;
    return `/meseriasi/${user.worker_id}`;
}

function buildOptimisticMessage(
    conversationId: number,
    senderUserId: number,
    body: string,
    tempId: number
): MessageItem {
    return {
        id: tempId,
        conversation_id: conversationId,
        sender_user_id: senderUserId,
        body,
        attachment_filename: null,
        attachment_original_name: null,
        attachment_mime: null,
        message_type: "text",
        read_at: null,
        created_at: new Date().toISOString(),
    };
}

export function MesajeView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const { refresh: refreshUnreadCount } = useUnreadMessagesCount();
    const meId = user?.id ? Number(user.id) : null;

    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
    const [draft, setDraft] = useState("");
    const [loadingList, setLoadingList] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [listFilter, setListFilter] = useState<ListFilter>("all");
    const [menuOpen, setMenuOpen] = useState(false);
    const [reportReason, setReportReason] = useState<ReportReason>("spam");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mobileShowThread, setMobileShowThread] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);
    const activeIdRef = useRef<number | null>(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [maintenanceOpen, setMaintenanceOpen] = useState(false);
    const openingRef = useRef(false);
    const prevMessageCountRef = useRef(0);

    const filteredConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        let list = conversations;

        if (listFilter === "unread") {
            list = list.filter((c) => c.unread_count > 0);
        }

        if (!query) return list;

        return list.filter((c) => matchesConversationSearch(c, query, getMessagePreview));
    }, [conversations, searchQuery, listFilter]);

    const otherUser = activeConversation?.other_user ?? null;
    const isWorkerConversation = Boolean(otherUser?.worker_id);
    const showSafetyMenu =
        normalizeUserRole(user?.role) === "client" && isWorkerConversation;
    const isCurrentUserWorker = normalizeUserRole(user?.role) === "worker";
    const showMaintenanceButton =
        isCurrentUserWorker && Boolean(otherUser) && !isMessagingBlocked;
    const isClientUser = normalizeUserRole(user?.role) === "client";
    const isMessagingBlocked =
        Boolean(otherUser?.is_blocked_by_me) || Boolean(otherUser?.is_blocked_by_other);

    useEffect(() => {
        setReportOpen(false);
    }, [activeId, showSafetyMenu]);

    const loadConversations = useCallback(async () => {
        const { data, error: listError } = await listConversations();
        if (listError) {
            setError(listError);
            setConversations([]);
        } else {
            setConversations(data ?? []);
        }
        setLoadingList(false);
        void refreshUnreadCount();
    }, [refreshUnreadCount]);

    const refreshActiveConversation = useCallback(async () => {
        if (!activeId) return;
        const { data } = await getConversationMessages(activeId);
        if (data) {
            setMessages(data.messages);
            setActiveConversation(data.conversation);
            void refreshUnreadCount();
        }
    }, [activeId, refreshUnreadCount]);

    const openConversation = useCallback(
        async (conversationId: number) => {
            setLoadingThread(true);
            setError(null);
            setActiveId(conversationId);
            setMobileShowThread(true);
            shouldAutoScrollRef.current = true;

            const { data, error: threadError } = await getConversationMessages(conversationId);
            if (threadError || !data) {
                setError(threadError || "Conversația nu a putut fi încărcată.");
                setLoadingThread(false);
                return;
            }

            setActiveConversation(data.conversation);
            setMessages(data.messages);
            setLoadingThread(false);
            void loadConversations();
        },
        [loadConversations]
    );

    useEffect(() => {
        void loadConversations();
        const interval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void loadConversations();
            }
        }, THREAD_POLL_MS);
        return () => window.clearInterval(interval);
    }, [loadConversations]);

    useEffect(() => {
        activeIdRef.current = activeId;
        if (!activeId) return;

        const poll = () => {
            if (document.visibilityState !== "visible") return;
            const conversationId = activeIdRef.current;
            if (!conversationId) return;

            void getConversationMessages(conversationId).then(({ data }) => {
                if (!data || activeIdRef.current !== conversationId) return;

                setMessages((prev) => {
                    const merged = mergeThreadMessages(prev, data.messages);
                    if (merged.length > prev.length) {
                        shouldAutoScrollRef.current = true;
                    }
                    return merged;
                });
                setActiveConversation(data.conversation);
                setConversations((prev) =>
                    prev.map((conversation) =>
                        conversation.id === data.conversation.id
                            ? data.conversation
                            : conversation
                    )
                );
                void refreshUnreadCount();
            });
        };

        poll();
        const interval = setInterval(poll, THREAD_POLL_MS);
        const onVisible = () => {
            if (document.visibilityState === "visible") poll();
        };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onVisible);
        };
    }, [activeId, refreshUnreadCount]);

    useEffect(() => {
        const paramId = searchParams.get("c");
        const withUser = searchParams.get("with");
        const jobParam = searchParams.get("job");

        if (openingRef.current) return;

        if (paramId) {
            const id = parseInt(paramId, 10);
            if (!Number.isNaN(id)) {
                openingRef.current = true;
                void openConversation(id).finally(() => {
                    openingRef.current = false;
                    router.replace("/mesaje", { scroll: false });
                });
            }
            return;
        }

        if (withUser) {
            const otherId = parseInt(withUser, 10);
            const jobId = jobParam ? parseInt(jobParam, 10) : undefined;
            if (!Number.isNaN(otherId)) {
                openingRef.current = true;
                void (async () => {
                    const { data, error: openError } = await findOrCreateConversation({
                        other_user_id: otherId,
                        ...(jobId && !Number.isNaN(jobId) ? { job_id: jobId } : {}),
                    });
                    openingRef.current = false;
                    router.replace("/mesaje", { scroll: false });
                    if (openError || !data) {
                        setError(openError || "Nu s-a putut deschide conversația.");
                        return;
                    }
                    await openConversation(data.id);
                })();
            }
        }
    }, [searchParams, openConversation, router]);

    const onScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        shouldAutoScrollRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, []);

    useEffect(() => {
        if (messages.length === prevMessageCountRef.current) return;
        const grew = messages.length > prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;
        if (grew && shouldAutoScrollRef.current) {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            });
        }
    }, [messages]);

    useAutoDismiss(actionMessage, () => setActionMessage(null));
    useAutoDismiss(error, () => setError(null), 6000);

    const handleSend = async () => {
        const text = draft.trim();
        if (!activeId || sending || isMessagingBlocked || meId == null) return;
        if (!text && !pendingFile) return;

        const tempId = -Date.now();
        const fileToSend = pendingFile;
        const hadFile = Boolean(fileToSend);

        if (!hadFile) {
            setMessages((prev) => [
                ...prev,
                buildOptimisticMessage(activeId, meId, text, tempId),
            ]);
            setPendingIds((prev) => new Set(prev).add(tempId));
        }

        setDraft("");
        setPendingFile(null);
        setSending(true);
        shouldAutoScrollRef.current = true;

        const { data, error: sendError } = hadFile
            ? await sendMessageAttachment(activeId, fileToSend!, text)
            : await sendMessage(activeId, text);

        setSending(false);
        setPendingIds((prev) => {
            const next = new Set(prev);
            next.delete(tempId);
            return next;
        });

        if (sendError || !data) {
            if (!hadFile) {
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
            }
            setError(
                sendError === "Messaging is not available with this user."
                    ? "Nu poți trimite mesaje în această conversație."
                    : sendError || "Mesajul nu a fost trimis."
            );
            if (hadFile) setPendingFile(fileToSend);
            else setDraft(text);
            return;
        }

        setMessages((prev) => {
            if (hadFile) return [...prev, data];
            return prev.map((m) => (m.id === tempId ? data : m));
        });
        void loadConversations();
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validationError = validateMessageFile(file);
        if (validationError) {
            setError(validationError);
            event.target.value = "";
            return;
        }

        setPendingFile(file);
        setError(null);
        event.target.value = "";
    };

    const handleBlockToggle = async () => {
        if (!showSafetyMenu || !otherUser?.id) return;
        setMenuOpen(false);
        setActionMessage(null);

        const result = otherUser.is_blocked_by_me
            ? await unblockUser(otherUser.id)
            : await blockUser(otherUser.id);

        if (!result.success) {
            setError(result.error || "Acțiunea nu a putut fi finalizată.");
            return;
        }

        setActionMessage(
            otherUser.is_blocked_by_me
                ? "Meseriașul a fost deblocat."
                : "Meseriașul a fost blocat."
        );
        await refreshActiveConversation();
        void loadConversations();
    };

    const handleSubmitReport = async () => {
        if (!showSafetyMenu || !otherUser?.id || reportSubmitting) return;

        setReportSubmitting(true);
        const result = await reportUser(otherUser.id, {
            reason: reportReason,
            details: reportDetails.trim() || undefined,
            conversation_id: activeId ?? undefined,
        });
        setReportSubmitting(false);

        if (!result.success) {
            setError(result.error || "Raportarea nu a putut fi trimisă.");
            return;
        }

        setReportOpen(false);
        setActionMessage("Raportul a fost trimis. Îți mulțumim.");
    };

    return (
        <div className={cn(pageWidthClass, "flex min-h-0 flex-1 flex-col py-1")}>
            {error && (
                <ToastBanner variant="error" message={error} onDismiss={() => setError(null)} />
            )}
            {actionMessage && (
                <ToastBanner
                    variant="success"
                    message={actionMessage}
                    onDismiss={() => setActionMessage(null)}
                />
            )}

            <div className="flex min-h-[min(72vh,52rem)] flex-1 overflow-hidden rounded-2xl border border-stroke/80 bg-white shadow-[0_8px_40px_-12px_rgba(0,32,80,0.12)] dark:border-white/[0.08] dark:bg-[#0e0e10] dark:shadow-none">
                <ConversationSidebar
                    conversations={conversations}
                    filteredConversations={filteredConversations}
                    activeId={activeId}
                    loading={loadingList}
                    searchQuery={searchQuery}
                    listFilter={listFilter}
                    mobileHidden={mobileShowThread}
                    getAvatarUrl={getParticipantAvatar}
                    onSearchChange={setSearchQuery}
                    onFilterChange={setListFilter}
                    onSelect={(id) => void openConversation(id)}
                />

                <section
                    className={cn(
                        "flex min-w-0 flex-1 flex-col bg-white dark:bg-[#0e0e10]",
                        !mobileShowThread && "hidden md:flex"
                    )}
                >
                    {!activeId || !activeConversation ? (
                        <EmptyThreadPlaceholder />
                    ) : (
                        <>
                            <ConversationHeader
                                conversation={activeConversation}
                                avatarUrl={getParticipantAvatar(otherUser)}
                                profileHref={getWorkerProfileHref(otherUser)}
                                showSafetyMenu={showSafetyMenu}
                                showMaintenanceButton={showMaintenanceButton}
                                isMessagingBlocked={isMessagingBlocked}
                                menuOpen={menuOpen}
                                onMenuOpenChange={setMenuOpen}
                                onBack={() => setMobileShowThread(false)}
                                onBlockToggle={() => void handleBlockToggle()}
                                onReport={() => {
                                    if (!showSafetyMenu) return;
                                    setMenuOpen(false);
                                    setReportReason("spam");
                                    setReportDetails("");
                                    setReportOpen(true);
                                }}
                                onScheduleMaintenance={() => setMaintenanceOpen(true)}
                            />

                            {isMessagingBlocked && (
                                <BlockedBanner blockedByMe={Boolean(otherUser?.is_blocked_by_me)} />
                            )}

                            <ThreadMessages
                                messages={messages}
                                currentUserId={meId}
                                isClientUser={isClientUser}
                                loading={loadingThread}
                                pendingIds={pendingIds}
                                scrollContainerRef={scrollContainerRef}
                                messagesEndRef={messagesEndRef}
                                onScroll={onScroll}
                                onProposalUpdated={() => void refreshActiveConversation()}
                                onProposalError={(message) => setError(message)}
                            />

                            <SendingIndicator visible={sending && Boolean(pendingFile)} />

                            {isMessagingBlocked ? (
                                <div className="shrink-0 border-t border-stroke/80 px-4 py-3 text-center text-xs text-dark-5 dark:border-white/[0.06] dark:text-[#9CA3AF]">
                                    Trimiterea mesajelor este dezactivată.
                                </div>
                            ) : (
                                <MessageComposer
                                    draft={draft}
                                    onDraftChange={setDraft}
                                    pendingFile={pendingFile}
                                    onFileSelect={handleFileSelect}
                                    onClearFile={() => setPendingFile(null)}
                                    onSend={() => void handleSend()}
                                    sending={sending}
                                />
                            )}

                        </>
                    )}
                </section>
            </div>

            <ReportDialog
                open={reportOpen && showSafetyMenu}
                onOpenChange={(next) => {
                    setReportOpen(next);
                    if (!next) setReportDetails("");
                }}
                reason={reportReason}
                details={reportDetails}
                submitting={reportSubmitting}
                onReasonChange={setReportReason}
                onDetailsChange={setReportDetails}
                onSubmit={() => void handleSubmitReport()}
            />

            {activeId && (
                <MaintenanceProposalModal
                    open={maintenanceOpen}
                    onOpenChange={setMaintenanceOpen}
                    conversationId={activeId}
                    onCreated={() => {
                        shouldAutoScrollRef.current = true;
                        void refreshActiveConversation();
                        void loadConversations();
                        setActionMessage("Programarea a fost trimisă clientului.");
                    }}
                    onError={(message) => setError(message)}
                />
            )}
        </div>
    );
}

"use client";

import { memo } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMessageTime } from "@/lib/format-message-time";
import { getMessagePreview, type ConversationItem } from "@/lib/messaging";
import { cn } from "@/lib/utils";

type ConversationListItemProps = {
    conversation: ConversationItem;
    isActive: boolean;
    avatarUrl: string | null;
    onSelect: () => void;
};

export const ConversationListItem = memo(function ConversationListItem({
    conversation,
    isActive,
    avatarUrl,
    onSelect,
}: ConversationListItemProps) {
    const other = conversation.other_user;
    const preview = getMessagePreview(conversation.last_message);
    const hasUnread = conversation.unread_count > 0;
    const isBlocked =
        Boolean(other?.is_blocked_by_me) || Boolean(other?.is_blocked_by_other);

    return (
        <li className="px-2">
            <button
                type="button"
                onClick={onSelect}
                className={cn(
                    "group relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
                    isActive
                        ? "bg-[#16366d]/10 shadow-sm ring-1 ring-[#16366d]/15 dark:bg-white/[0.07] dark:ring-white/[0.1]"
                        : "hover:bg-gray-1/80 dark:hover:bg-white/[0.04]"
                )}
            >
                {isActive && (
                    <span
                        className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-[#16366d] dark:bg-[#5b9fff]"
                        aria-hidden
                    />
                )}
                <div className="relative shrink-0">
                    <UserAvatar
                        src={avatarUrl}
                        alt={other?.display_name || "Utilizator"}
                        sizes="44px"
                        containerClassName="relative size-11 overflow-hidden rounded-full ring-2 ring-white dark:ring-[#141414]"
                    />
                    {hasUnread && (
                        <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-[#0060f0] dark:border-[#141414] dark:bg-[#5b9fff]" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <p
                            className={cn(
                                "truncate text-sm text-dark dark:text-white",
                                hasUnread ? "font-bold" : "font-semibold"
                            )}
                        >
                            {other?.display_name || "Utilizator"}
                        </p>
                        {conversation.last_message && (
                            <time
                                className={cn(
                                    "shrink-0 text-[10px]",
                                    hasUnread
                                        ? "font-semibold text-[#0060f0] dark:text-[#5b9fff]"
                                        : "text-dark-5 dark:text-[#9CA3AF]"
                                )}
                                dateTime={conversation.last_message.created_at}
                            >
                                {formatMessageTime(conversation.last_message.created_at)}
                            </time>
                        )}
                    </div>
                    {other?.profession && (
                        <p className="truncate text-[11px] text-dark-5 dark:text-[#9CA3AF]">
                            {other.profession}
                        </p>
                    )}
                    {conversation.job_title && (
                        <p className="mt-0.5 truncate text-[11px] font-medium text-[#0060f0] dark:text-[#5b9fff]">
                            {conversation.job_title}
                        </p>
                    )}
                    <p
                        className={cn(
                            "mt-0.5 truncate text-xs",
                            hasUnread
                                ? "font-medium text-dark dark:text-[#D1D5DB]"
                                : "text-dark-5 dark:text-[#9CA3AF]",
                            isBlocked && "italic"
                        )}
                    >
                        {isBlocked ? "Conversație restricționată" : preview}
                    </p>

                </div>
            </button>
        </li>
    );
});

function ConversationListSkeleton() {
    return (
        <ul className="space-y-1 px-2 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex gap-3 rounded-xl px-3 py-3">
                    <Skeleton className="size-11 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

type ListFilter = "all" | "unread";

type ConversationSidebarProps = {
    conversations: ConversationItem[];
    filteredConversations: ConversationItem[];
    activeId: number | null;
    loading: boolean;
    searchQuery: string;
    listFilter: ListFilter;
    mobileHidden: boolean;
    getAvatarUrl: (user: ConversationItem["other_user"]) => string | null;
    onSearchChange: (value: string) => void;
    onFilterChange: (filter: ListFilter) => void;
    onSelect: (id: number) => void;
};

export function ConversationSidebar({
    conversations,
    filteredConversations,
    activeId,
    loading,
    searchQuery,
    listFilter,
    mobileHidden,
    getAvatarUrl,
    onSearchChange,
    onFilterChange,
    onSelect,
}: ConversationSidebarProps) {
    return (
        <aside
            className={cn(
                "flex w-full shrink-0 flex-col bg-gray-1/30 dark:bg-[#101012]/50 md:w-[22rem] md:border-r md:border-stroke/80 dark:md:border-white/[0.06]",
                mobileHidden && "hidden md:flex"
            )}
        >
            <div className="shrink-0 border-b border-stroke/80 px-4 pb-3 pt-4 dark:border-white/[0.06]">
                <h2 className="mb-3 text-base font-bold tracking-tight text-dark dark:text-white">
                    Mesaje
                </h2>

                <div className="relative">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-5 dark:text-[#6B7280]"
                        aria-hidden
                    />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Caută în mesaje"
                        className="h-10 w-full rounded-xl border border-stroke/80 bg-white pl-9 pr-9 text-sm text-dark outline-none transition-shadow focus:border-[#0060f0] focus:ring-2 focus:ring-[#0060f0]/15 dark:border-white/[0.08] dark:bg-[#0c0c0e] dark:text-white dark:focus:border-[#5b9fff] dark:focus:ring-[#5b9fff]/20"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-dark-5 hover:bg-gray-1 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06]"
                            aria-label="Șterge căutarea"
                        >
                            <X className="size-3.5" aria-hidden />
                        </button>
                    )}
                </div>

                <div className="mt-2.5 flex gap-1 rounded-xl bg-white p-1 dark:bg-white/[0.04]">
                    {(["all", "unread"] as const).map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => onFilterChange(filter)}
                            className={cn(
                                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                                listFilter === filter
                                    ? "bg-[#16366d] text-white shadow-sm dark:bg-[#f1f6ff] dark:text-[#16366d]"
                                    : "text-dark-5 hover:bg-gray-1 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                            )}
                        >
                            {filter === "all" ? "Toate" : "Necitite"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-2">
                {loading ? (
                    <ConversationListSkeleton />
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-16 text-center">
                        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#16366d]/10 dark:bg-white/[0.06]">
                            <MessageCircle className="size-6 text-[#16366d]/50 dark:text-[#9CA3AF]" />
                        </div>
                        <p className="text-sm font-medium text-dark dark:text-white">
                            Nicio conversație încă
                        </p>
                        <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
                            Contactează un meseriaș din profilul lui pentru a începe.
                        </p>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                            {listFilter === "unread"
                                ? "Nu ai mesaje necitite."
                                : `Niciun rezultat pentru „${searchQuery.trim()}”.`}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-0.5">
                        {filteredConversations.map((conversation) => (
                            <ConversationListItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeId}
                                avatarUrl={getAvatarUrl(conversation.other_user)}
                                onSelect={() => onSelect(conversation.id)}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}

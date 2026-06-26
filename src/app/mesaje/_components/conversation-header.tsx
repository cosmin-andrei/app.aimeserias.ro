"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Flag, MessageCircle, MoreVertical, ShieldAlert, Wrench } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import {
    Dropdown,
    DropdownClose,
    DropdownContent,
    DropdownTrigger,
} from "@/components/ui/dropdown";
import type { ConversationItem } from "@/lib/messaging";
import { InAppCallButton } from "./in-app-call-button";

type ConversationHeaderProps = {
    conversation: ConversationItem;
    avatarUrl: string | null;
    profileHref: string | null;
    showSafetyMenu: boolean;
    showMaintenanceButton: boolean;
    isMessagingBlocked: boolean;
    menuOpen: boolean;
    onMenuOpenChange: Dispatch<SetStateAction<boolean>>;
    onBack: () => void;
    onBlockToggle: () => void;
    onReport: () => void;
    onScheduleMaintenance: () => void;
};

export function ConversationHeader({
    conversation,
    avatarUrl,
    profileHref,
    showSafetyMenu,
    showMaintenanceButton,
    isMessagingBlocked,
    menuOpen,
    onMenuOpenChange,
    onBack,
    onBlockToggle,
    onReport,
    onScheduleMaintenance,
}: ConversationHeaderProps) {
    const other = conversation.other_user;

    const identity = (
        <>
            <UserAvatar
                src={avatarUrl}
                alt={other?.display_name || "Utilizator"}
                sizes="44px"
                containerClassName="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-stroke/50 dark:ring-white/[0.08]"
            />
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-dark dark:text-white">
                    {other?.display_name || "Utilizator"}
                </p>
                {other?.profession && (
                    <p className="truncate text-xs text-dark-5 dark:text-[#9CA3AF]">
                        {other.profession}
                    </p>
                )}
                {conversation.job_title && (
                    <p className="truncate text-[11px] font-medium text-[#0060f0] dark:text-[#5b9fff]">
                        {conversation.job_title}
                    </p>
                )}
            </div>
        </>
    );

    return (
        <header className="flex shrink-0 items-center gap-2 border-b border-stroke/80 bg-white/80 px-3 py-2.5 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#121214]/80">
            <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-1 md:hidden dark:text-[#9CA3AF] dark:hover:bg-white/[0.06]"
                onClick={onBack}
                aria-label="Înapoi la listă"
            >
                <ArrowLeft className="size-4" aria-hidden />
            </button>

            {profileHref ? (
                <Link
                    href={profileHref}
                    className="flex min-w-0 max-w-[calc(100%-11rem)] items-center gap-2.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-gray-1/80 dark:hover:bg-white/[0.04] sm:max-w-[calc(100%-13rem)]"
                >
                    {identity}
                </Link>
            ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3 px-1">{identity}</div>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-0.5">
                {showMaintenanceButton && (
                    <button
                        type="button"
                        onClick={onScheduleMaintenance}
                        className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/15"
                        aria-label="Programare mentenanță"
                        title="Programare mentenanță"
                    >
                        <Wrench className="size-3.5 shrink-0" aria-hidden />
                        <span className="hidden sm:inline">Programare</span>
                    </button>
                )}
                {other && !isMessagingBlocked && (
                    <InAppCallButton
                        conversationId={conversation.id}
                        otherName={other.display_name || "Utilizator"}
                    />
                )}

                {showSafetyMenu && (
                    <Dropdown isOpen={menuOpen} setIsOpen={onMenuOpenChange}>
                        <DropdownTrigger className="flex size-9 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-1 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06]">
                            <MoreVertical className="size-4" aria-hidden />
                            <span className="sr-only">Acțiuni conversație</span>
                        </DropdownTrigger>
                        <DropdownContent
                            align="end"
                            className="min-w-[13rem] animate-dropdown-enter rounded-xl border border-stroke bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#1a1a1c]"
                        >
                            <DropdownClose>
                                <button
                                    type="button"
                                    onClick={onBlockToggle}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-dark transition-colors hover:bg-gray-1 dark:text-[#E5E7EB] dark:hover:bg-white/[0.06]"
                                >
                                    <Ban className="size-4 shrink-0" aria-hidden />
                                    {other?.is_blocked_by_me
                                        ? "Deblochează meseriașul"
                                        : "Blochează meseriașul"}
                                </button>
                            </DropdownClose>
                            <DropdownClose>
                                <button
                                    type="button"
                                    onClick={onReport}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red transition-colors hover:bg-red/10 dark:text-red"
                                >
                                    <Flag className="size-4 shrink-0" aria-hidden />
                                    Raportează
                                </button>
                            </DropdownClose>
                        </DropdownContent>
                    </Dropdown>
                )}
            </div>
        </header>
    );
}

export function BlockedBanner({
    blockedByMe,
}: {
    blockedByMe: boolean;
}) {
    return (
        <div className="flex shrink-0 items-center gap-2 border-b border-amber-200/80 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-100">
            <ShieldAlert className="size-4 shrink-0" aria-hidden />
            <p>
                {blockedByMe
                    ? "Ai blocat acest meseriaș. Trimiterea mesajelor este dezactivată."
                    : "Nu poți trimite mesaje în această conversație."}
            </p>
        </div>
    );
}

export function EmptyThreadPlaceholder() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-[#16366d]/20 blur-2xl dark:bg-[#5b9fff]/10" />
                <div className="relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#16366d]/15 to-[#0060f0]/10 dark:from-white/[0.08] dark:to-[#5b9fff]/10">
                    <MessageCircle className="size-8 text-[#16366d]/60 dark:text-[#5b9fff]/70" />
                </div>
            </div>
            <div>
                <p className="text-base font-semibold text-dark dark:text-white">
                    Mesageria ta
                </p>
                <p className="mt-1 max-w-xs text-sm text-dark-5 dark:text-[#9CA3AF]">
                    Selectează o conversație din stânga sau contactează un meseriaș direct din profilul lui.
                </p>
            </div>
        </div>
    );
}

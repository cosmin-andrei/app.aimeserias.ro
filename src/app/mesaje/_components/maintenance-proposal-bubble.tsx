"use client";

import { useState } from "react";
import { CalendarClock, Check, Loader2, MapPin, Wrench, X } from "lucide-react";
import {
    acceptMaintenanceProposal,
    declineMaintenanceProposal,
    formatMaintenanceDateRange,
    MAINTENANCE_STATUS_LABELS,
    type MaintenanceProposalItem,
} from "@/lib/maintenance-proposal";
import { formatMessageTime } from "@/lib/format-message-time";
import { cn } from "@/lib/utils";

type MaintenanceProposalBubbleProps = {
    proposal: MaintenanceProposalItem;
    createdAt: string;
    isClient: boolean;
    onUpdated: () => void;
    onError: (message: string) => void;
};

export function MaintenanceProposalBubble({
    proposal,
    createdAt,
    isClient,
    onUpdated,
    onError,
}: MaintenanceProposalBubbleProps) {
    const [acting, setActing] = useState<"accept" | "decline" | null>(null);

    const isPending = proposal.status === "pending";
    const canRespond = isClient && isPending;

    const handleAccept = async () => {
        if (acting) return;
        setActing("accept");
        const result = await acceptMaintenanceProposal(proposal.id);
        setActing(null);
        if (!result.success) {
            onError(result.error || "Acceptarea a eșuat.");
            return;
        }
        onUpdated();
    };

    const handleDecline = async () => {
        if (acting) return;
        setActing("decline");
        const result = await declineMaintenanceProposal(proposal.id);
        setActing(null);
        if (!result.success) {
            onError(result.error || "Refuzul a eșuat.");
            return;
        }
        onUpdated();
    };

    return (
        <div className="w-full max-w-sm rounded-2xl border border-stroke/80 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#1a1a1c]">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0060f0]/10 text-[#0060f0] dark:bg-[#5b9fff]/10 dark:text-[#5b9fff]">
                    <Wrench className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dark dark:text-white">
                        Mentenanță / reparație
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[#16366d] dark:text-[#5b9fff]">
                        {proposal.title}
                    </p>
                </div>
            </div>

            <div className="mt-3 space-y-2 text-xs text-dark-5 dark:text-[#9CA3AF]">
                <div className="flex items-start gap-2">
                    <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{formatMaintenanceDateRange(proposal.starts_at, proposal.ends_at)}</span>
                </div>
                {proposal.location && (
                    <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        <span>{proposal.location}</span>
                    </div>
                )}
                {proposal.job_title && (
                    <p>
                        <span className="font-medium text-dark dark:text-[#E5E7EB]">Proiect: </span>
                        {proposal.job_title}
                    </p>
                )}
                {proposal.description && (
                    <p className="whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
                )}
                {proposal.materials && (
                    <p>
                        <span className="font-medium text-dark dark:text-[#E5E7EB]">Materiale: </span>
                        {proposal.materials}
                    </p>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <span
                    className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                        proposal.status === "pending" &&
                            "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
                        proposal.status === "accepted" &&
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
                        proposal.status === "declined" &&
                            "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
                        proposal.status === "cancelled" &&
                            "bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-[#9CA3AF]"
                    )}
                >
                    {MAINTENANCE_STATUS_LABELS[proposal.status]}
                </span>
                <time className="text-[10px] text-dark-5 dark:text-[#9CA3AF]" dateTime={createdAt}>
                    {formatMessageTime(createdAt)}
                </time>
            </div>

            {canRespond && (
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={() => void handleDecline()}
                        disabled={acting !== null}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stroke px-3 py-2 text-xs font-medium text-dark transition-colors hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.1] dark:text-[#E5E7EB] dark:hover:bg-white/[0.06]"
                    >
                        {acting === "decline" ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                            <X className="size-3.5" aria-hidden />
                        )}
                        Refuză
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleAccept()}
                        disabled={acting !== null}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#16366d] px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#f1f6ff] dark:text-[#16366d]"
                    >
                        {acting === "accept" ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                            <Check className="size-3.5" aria-hidden />
                        )}
                        Acceptă
                    </button>
                </div>
            )}

            {proposal.status === "accepted" && (
                <p className="mt-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                    Programarea a fost adăugată în calendarul ambilor.
                </p>
            )}
        </div>
    );
}

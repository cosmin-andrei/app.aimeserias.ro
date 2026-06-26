"use client";

import { Phone } from "lucide-react";
import { useVoiceCall } from "@/contexts/VoiceCallContext";
import { cn } from "@/lib/utils";

type InAppCallButtonProps = {
    conversationId: number;
    otherName: string;
    disabled?: boolean;
};

export function InAppCallButton({
    conversationId,
    otherName,
    disabled = false,
}: InAppCallButtonProps) {
    const { startCall, uiState } = useVoiceCall();
    const busy =
        uiState !== "idle" && uiState !== "ended" && uiState !== "requesting_mic";

    return (
        <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void startCall(conversationId, otherName)}
            className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#0060f0]/10 px-2.5 text-xs font-medium text-[#0060f0] transition-colors hover:bg-[#0060f0]/15 disabled:opacity-40 dark:bg-[#5b9fff]/10 dark:text-[#5b9fff] dark:hover:bg-[#5b9fff]/15"
            )}
            aria-label="Apel vocal"
            title="Apel vocal"
        >
            <Phone className="size-3.5 shrink-0" aria-hidden />
            <span>Apel vocal</span>
        </button>
    );
}

"use client";

import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useVoiceCall, type VoiceCallUiState } from "@/contexts/VoiceCallContext";
import { cn } from "@/lib/utils";

function formatDuration(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function statusLabel(state: VoiceCallUiState) {
    switch (state) {
        case "requesting_mic":
            return "Permite accesul la microfon în browser…";
        case "outgoing":
            return "Se apelează…";
        case "incoming":
            return "Apel primit";
        case "connecting":
            return "Se conectează…";
        case "active":
            return "Apel în desfășurare";
        case "ended":
            return "Apel încheiat";
        default:
            return "";
    }
}

export function VoiceCallOverlay() {
    const {
        uiState,
        otherName,
        error,
        micErrorCanRetry,
        isMuted,
        startedAt,
        acceptCall,
        rejectCall,
        hangUp,
        toggleMute,
        clearError,
        retryMicrophone,
    } = useVoiceCall();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (uiState !== "active" || !startedAt) {
            setElapsed(0);
            return;
        }
        const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
        tick();
        const interval = window.setInterval(tick, 1000);
        return () => window.clearInterval(interval);
    }, [uiState, startedAt]);

    if (uiState === "idle") return null;

    const showIncomingActions = uiState === "incoming";

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Apel vocal"
        >
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-[#16366d] to-[#0b1f42] p-6 text-white shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
                        <Phone className="size-9" aria-hidden />
                    </div>
                    <p className="text-lg font-semibold">{otherName || "Utilizator"}</p>
                    <p className="mt-1 text-sm text-white/70">{statusLabel(uiState)}</p>
                    {uiState === "active" && (
                        <p className="mt-2 text-2xl font-bold tabular-nums">
                            {formatDuration(elapsed)}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mt-4 rounded-xl bg-red-500/20 px-3 py-3 text-center text-sm text-red-100">
                        <p>{error}</p>
                        <div className="mt-2 flex items-center justify-center gap-3">
                            {micErrorCanRetry && (
                                <button
                                    type="button"
                                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium transition hover:bg-white/25"
                                    onClick={() => void retryMicrophone()}
                                >
                                    Permite microfonul
                                </button>
                            )}
                            <button
                                type="button"
                                className="text-xs underline"
                                onClick={() => {
                                    clearError();
                                    if (uiState === "requesting_mic") {
                                        void hangUp();
                                    }
                                }}
                            >
                                Închide
                            </button>
                        </div>
                    </div>
                )}

                {uiState === "requesting_mic" && !error && (
                    <p className="mt-4 text-center text-xs text-white/70">
                        Browserul va afișa o fereastră — alege „Permite” pentru microfon.
                    </p>
                )}

                <div className="mt-8 flex items-center justify-center gap-4">
                    {showIncomingActions ? (
                        <>
                            <button
                                type="button"
                                onClick={() => void rejectCall()}
                                className="flex size-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                                aria-label="Respinge apelul"
                            >
                                <PhoneOff className="size-6" />
                            </button>
                            <button
                                type="button"
                                onClick={() => void acceptCall()}
                                className="flex size-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600"
                                aria-label="Acceptă apelul"
                            >
                                <Phone className="size-6" />
                            </button>
                        </>
                    ) : (
                        <>
                            {uiState === "active" && (
                                <button
                                    type="button"
                                    onClick={toggleMute}
                                    className={cn(
                                        "flex size-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20",
                                        isMuted && "bg-white/25"
                                    )}
                                    aria-label={isMuted ? "Activează microfonul" : "Dezactivează microfonul"}
                                >
                                    {isMuted ? (
                                        <MicOff className="size-5" />
                                    ) : (
                                        <Mic className="size-5" />
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => void hangUp()}
                                className="flex size-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                                aria-label="Închide apelul"
                            >
                                <PhoneOff className="size-6" />
                            </button>
                        </>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-white/50">
                    Apel vocal
                </p>
            </div>
        </div>
    );
}

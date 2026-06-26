"use client";

import {
    acceptVoiceCall,
    endVoiceCall,
    fetchVoiceCallSession,
    fetchVoiceCallSignals,
    postVoiceCallSignal,
    rejectVoiceCall,
    startVoiceCall,
    type VoiceCallSession,
} from "@/lib/voice-call-api";
import {
    releaseMicrophoneStream,
    requestMicrophoneAccess,
} from "@/lib/voice-call/microphone";
import { WebRtcVoicePeer } from "@/lib/voice-call/webrtc-peer";
import { useUser } from "@/hooks/useUser";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type PropsWithChildren,
} from "react";

export type VoiceCallUiState =
    | "idle"
    | "requesting_mic"
    | "outgoing"
    | "incoming"
    | "connecting"
    | "active"
    | "ended";

type VoiceCallContextValue = {
    uiState: VoiceCallUiState;
    activeCall: VoiceCallSession | null;
    otherName: string;
    error: string | null;
    micErrorCanRetry: boolean;
    isMuted: boolean;
    startedAt: number | null;
    startCall: (conversationId: number, otherName: string) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => Promise<void>;
    hangUp: () => Promise<void>;
    toggleMute: () => void;
    clearError: () => void;
    retryMicrophone: () => Promise<void>;
};

const VoiceCallContext = createContext<VoiceCallContextValue | null>(null);

const SESSION_POLL_MS = 2000;
const SIGNAL_POLL_MS = 1000;

export function VoiceCallProvider({ children }: PropsWithChildren) {
    const { user } = useUser();
    const meId = user?.id ? Number(user.id) : null;

    const [uiState, setUiState] = useState<VoiceCallUiState>("idle");
    const [activeCall, setActiveCall] = useState<VoiceCallSession | null>(null);
    const [otherName, setOtherName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [micErrorCanRetry, setMicErrorCanRetry] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [startedAt, setStartedAt] = useState<number | null>(null);

    const peerRef = useRef<WebRtcVoicePeer | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const lastSignalIdRef = useRef(0);
    const localInitiatedCallIdRef = useRef<number | null>(null);
    const processingRef = useRef(false);
    const uiStateRef = useRef<VoiceCallUiState>("idle");
    const pendingConversationRef = useRef<{ id: number; name: string } | null>(null);

    useEffect(() => {
        uiStateRef.current = uiState;
    }, [uiState]);

    const releaseMic = useCallback(() => {
        if (peerRef.current) return;
        releaseMicrophoneStream(micStreamRef.current);
        micStreamRef.current = null;
    }, []);

    const cleanupPeer = useCallback(() => {
        peerRef.current?.close();
        peerRef.current = null;
        releaseMicrophoneStream(micStreamRef.current);
        micStreamRef.current = null;
        lastSignalIdRef.current = 0;
        localInitiatedCallIdRef.current = null;
        pendingConversationRef.current = null;
        setIsMuted(false);
        setStartedAt(null);
        setMicErrorCanRetry(false);
    }, []);

    const resetToIdle = useCallback(() => {
        cleanupPeer();
        setActiveCall(null);
        setOtherName("");
        setUiState("idle");
    }, [cleanupPeer]);

    const failWithMicError = useCallback(
        (message: string, canRetry: boolean) => {
            setError(message);
            setMicErrorCanRetry(canRetry);
            releaseMic();
        },
        [releaseMic]
    );

    const acquireMicrophone = useCallback(async (): Promise<MediaStream | null> => {
        if (micStreamRef.current) {
            return micStreamRef.current;
        }

        setError(null);
        setMicErrorCanRetry(false);

        const result = await requestMicrophoneAccess();
        if (!result.ok) {
            failWithMicError(result.error, result.canRetry);
            return null;
        }

        micStreamRef.current = result.stream;
        return result.stream;
    }, [failWithMicError]);

    const ensurePeer = useCallback(async (stream?: MediaStream) => {
        if (peerRef.current) return peerRef.current;

        const micStream = stream ?? micStreamRef.current;
        if (!micStream) {
            throw new Error("Microphone stream missing.");
        }

        const peer = new WebRtcVoicePeer((candidate) => {
            const callId = localInitiatedCallIdRef.current;
            if (!callId) return;
            void postVoiceCallSignal(callId, "ice", candidate);
        });
        await peer.start(micStream);
        peerRef.current = peer;
        return peer;
    }, []);

    const processSignals = useCallback(
        async (call: VoiceCallSession) => {
            if (processingRef.current) return;
            processingRef.current = true;
            try {
                const { signals } = await fetchVoiceCallSignals(
                    call.id,
                    lastSignalIdRef.current
                );
                if (signals.length === 0) return;

                const peer = await ensurePeer();

                for (const signal of signals) {
                    lastSignalIdRef.current = Math.max(
                        lastSignalIdRef.current,
                        signal.id
                    );

                    if (signal.signal_type === "offer") {
                        await peer.applyRemoteDescription(
                            signal.payload as RTCSessionDescriptionInit
                        );
                        if (call.role === "callee" && call.status === "active") {
                            const answer = await peer.createAnswer();
                            await postVoiceCallSignal(call.id, "answer", answer);
                            setUiState("active");
                            setStartedAt(Date.now());
                        }
                    } else if (signal.signal_type === "answer") {
                        await peer.applyRemoteDescription(
                            signal.payload as RTCSessionDescriptionInit
                        );
                        setUiState("active");
                        setStartedAt(Date.now());
                    } else if (signal.signal_type === "ice") {
                        await peer.addIceCandidate(signal.payload as RTCIceCandidateInit);
                    } else if (signal.signal_type === "end") {
                        setUiState("ended");
                        window.setTimeout(resetToIdle, 1200);
                    }
                }
            } catch (err) {
                const message =
                    err instanceof Error && err.message === "Microphone stream missing."
                        ? "Microfonul nu este disponibil. Încearcă din nou."
                        : "Conexiunea apelului a eșuat.";
                setError(message);
                setMicErrorCanRetry(true);
            } finally {
                processingRef.current = false;
            }
        },
        [ensurePeer, resetToIdle]
    );

    const syncSession = useCallback(async () => {
        if (!meId) {
            resetToIdle();
            return;
        }

        if (uiStateRef.current === "requesting_mic") {
            return;
        }

        const { call } = await fetchVoiceCallSession();
        if (!call) {
            if (uiStateRef.current !== "idle" && uiStateRef.current !== "ended") {
                resetToIdle();
            }
            return;
        }

        localInitiatedCallIdRef.current = call.id;
        setActiveCall(call);
        setOtherName(call.other_user.display_name);

        if (call.status === "ringing" && call.role === "callee") {
            setUiState((prev) =>
                prev === "outgoing" || prev === "requesting_mic" ? prev : "incoming"
            );
        } else if (call.status === "ringing" && call.role === "caller") {
            setUiState((prev) =>
                prev === "requesting_mic" ? prev : "outgoing"
            );
        } else if (call.status === "active") {
            if (!peerRef.current && !micStreamRef.current) {
                setUiState("incoming");
                return;
            }
            setUiState((prev) => (prev === "active" ? prev : "connecting"));
            await processSignals(call);
        } else if (["ended", "rejected", "missed", "cancelled"].includes(call.status)) {
            setUiState("ended");
            window.setTimeout(resetToIdle, 1200);
        }
    }, [meId, resetToIdle, processSignals]);

    useEffect(() => {
        if (!meId) return;
        void syncSession();
        const interval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void syncSession();
            }
        }, SESSION_POLL_MS);
        return () => window.clearInterval(interval);
    }, [meId, syncSession]);

    useEffect(() => {
        if (!activeCall || !["connecting", "active", "outgoing"].includes(uiState)) {
            return;
        }
        const interval = window.setInterval(() => {
            void processSignals(activeCall);
        }, SIGNAL_POLL_MS);
        return () => window.clearInterval(interval);
    }, [activeCall, uiState, processSignals]);

    const startCall = useCallback(
        async (conversationId: number, name: string) => {
            setError(null);
            setMicErrorCanRetry(false);
            setOtherName(name);
            setUiState("requesting_mic");
            pendingConversationRef.current = { id: conversationId, name };

            const stream = await acquireMicrophone();
            if (!stream) {
                setUiState("requesting_mic");
                return;
            }

            setUiState("outgoing");

            const { call, error: startError } = await startVoiceCall(conversationId);
            if (!call || startError) {
                setError(startError ?? "Nu s-a putut iniția apelul.");
                resetToIdle();
                return;
            }

            try {
                localInitiatedCallIdRef.current = call.id;
                setActiveCall(call);
                const peer = await ensurePeer(stream);
                const offer = await peer.createOffer();
                await postVoiceCallSignal(call.id, "offer", offer);
            } catch {
                setError("Nu s-a putut iniția apelul.");
                if (call.id) {
                    await endVoiceCall(call.id, "cancelled");
                }
                resetToIdle();
            }
        },
        [acquireMicrophone, ensurePeer, resetToIdle]
    );

    const acceptCall = useCallback(async () => {
        if (!activeCall) return;
        setError(null);
        setMicErrorCanRetry(false);
        setUiState("requesting_mic");

        const stream = await acquireMicrophone();
        if (!stream) {
            setUiState("incoming");
            return;
        }

        setUiState("connecting");
        const { call, error: acceptError } = await acceptVoiceCall(activeCall.id);
        if (!call || acceptError) {
            setError(acceptError ?? "Nu s-a putut accepta apelul.");
            releaseMic();
            setUiState("incoming");
            return;
        }

        try {
            setActiveCall(call);
            await processSignals(call);
        } catch {
            setError("Nu s-a putut conecta apelul.");
            await endVoiceCall(call.id, "ended");
            resetToIdle();
        }
    }, [activeCall, acquireMicrophone, processSignals, releaseMic, resetToIdle]);

    const retryMicrophone = useCallback(async () => {
        setError(null);
        setMicErrorCanRetry(false);

        const stream = await acquireMicrophone();
        if (!stream) {
            if (activeCall?.status === "ringing" && activeCall.role === "callee") {
                setUiState("incoming");
            } else {
                setUiState("idle");
            }
            return;
        }

        if (pendingConversationRef.current) {
            const { id, name } = pendingConversationRef.current;
            pendingConversationRef.current = null;
            await startCall(id, name);
            return;
        }

        if (activeCall?.status === "ringing" && activeCall.role === "callee") {
            await acceptCall();
            return;
        }

        setUiState(activeCall ? "connecting" : "idle");
    }, [acquireMicrophone, activeCall, acceptCall, startCall]);

    const rejectCall = useCallback(async () => {
        if (!activeCall) return;
        await rejectVoiceCall(activeCall.id);
        resetToIdle();
    }, [activeCall, resetToIdle]);

    const hangUp = useCallback(async () => {
        if (!activeCall) {
            resetToIdle();
            return;
        }
        await postVoiceCallSignal(activeCall.id, "end", { reason: "ended" });
        await endVoiceCall(activeCall.id, "ended");
        setUiState("ended");
        window.setTimeout(resetToIdle, 800);
    }, [activeCall, resetToIdle]);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            peerRef.current?.setMuted(!prev);
            return !prev;
        });
    }, []);

    const value: VoiceCallContextValue = {
        uiState,
        activeCall,
        otherName,
        error,
        micErrorCanRetry,
        isMuted,
        startedAt,
        startCall,
        acceptCall,
        rejectCall,
        hangUp,
        toggleMute,
        clearError: () => {
            setError(null);
            setMicErrorCanRetry(false);
        },
        retryMicrophone,
    };

    return (
        <VoiceCallContext.Provider value={value}>{children}</VoiceCallContext.Provider>
    );
}

export function useVoiceCall() {
    const ctx = useContext(VoiceCallContext);
    if (!ctx) {
        throw new Error("useVoiceCall must be used within VoiceCallProvider");
    }
    return ctx;
}

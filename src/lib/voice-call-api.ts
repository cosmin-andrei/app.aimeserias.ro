import { apiFetch } from "@/lib/api-client";

export type VoiceCallStatus =
    | "ringing"
    | "active"
    | "ended"
    | "rejected"
    | "missed"
    | "cancelled";

export type VoiceCallSession = {
    id: number;
    conversation_id: number;
    caller_user_id: number;
    callee_user_id: number;
    status: VoiceCallStatus;
    ended_reason: string | null;
    answered_at: string | null;
    ended_at: string | null;
    created_at: string;
    updated_at: string;
    role: "caller" | "callee";
    other_user: {
        id: number;
        display_name: string;
    };
};

export type VoiceCallSignal = {
    id: number;
    call_id: number;
    sender_user_id: number;
    signal_type: "offer" | "answer" | "ice" | "end";
    payload: unknown;
    created_at: string;
};

function mapVoiceCallError(error?: string): string {
    switch (error) {
        case "Conversation not found.":
            return "Conversația nu a fost găsită.";
        case "Messaging is not available with this user.":
            return "Nu poți apela acest utilizator.";
        case "You already have an active call.":
            return "Ai deja un apel în curs.";
        case "The other user is busy on a call.":
            return "Utilizatorul este ocupat într-un alt apel.";
        case "Call not found.":
            return "Apelul nu a fost găsit.";
        case "Call is no longer available.":
            return "Apelul nu mai este disponibil.";
        case "Call is not active.":
            return "Apelul nu este activ.";
        default:
            return error || "Eroare la apel.";
    }
}

export async function fetchVoiceCallSession(): Promise<{
    call: VoiceCallSession | null;
    error?: string;
}> {
    const { data, error } = await apiFetch<{ call: VoiceCallSession | null }>(
        "/api/voice-calls/session",
        { method: "GET", cache: "no-store" }
    );
    if (error) {
        return { call: null, error: mapVoiceCallError(error) };
    }
    return { call: data?.call ?? null };
}

export async function startVoiceCall(conversationId: number): Promise<{
    call: VoiceCallSession | null;
    error?: string;
}> {
    const { data, error, status } = await apiFetch<{ call: VoiceCallSession }>(
        "/api/voice-calls",
        {
            method: "POST",
            body: JSON.stringify({ conversation_id: conversationId }),
        }
    );
    if (!data?.call || status >= 400) {
        return { call: null, error: mapVoiceCallError(error) };
    }
    return { call: data.call };
}

export async function acceptVoiceCall(callId: number): Promise<{
    call: VoiceCallSession | null;
    error?: string;
}> {
    const { data, error, status } = await apiFetch<{ call: VoiceCallSession }>(
        `/api/voice-calls/${callId}/accept`,
        { method: "POST", body: JSON.stringify({}) }
    );
    if (!data?.call || status >= 400) {
        return { call: null, error: mapVoiceCallError(error) };
    }
    return { call: data.call };
}

export async function rejectVoiceCall(callId: number): Promise<{ error?: string }> {
    const { error, status } = await apiFetch(`/api/voice-calls/${callId}/reject`, {
        method: "POST",
        body: JSON.stringify({}),
    });
    if (status >= 400) {
        return { error: mapVoiceCallError(error) };
    }
    return {};
}

export async function endVoiceCall(
    callId: number,
    reason = "ended"
): Promise<{ error?: string }> {
    const { error, status } = await apiFetch(`/api/voice-calls/${callId}/end`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });
    if (status >= 400) {
        return { error: mapVoiceCallError(error) };
    }
    return {};
}

export async function postVoiceCallSignal(
    callId: number,
    signalType: VoiceCallSignal["signal_type"],
    payload: unknown
): Promise<{ error?: string }> {
    const { error, status } = await apiFetch(`/api/voice-calls/${callId}/signals`, {
        method: "POST",
        body: JSON.stringify({ signal_type: signalType, payload }),
    });
    if (status >= 400) {
        return { error: mapVoiceCallError(error) };
    }
    return {};
}

export async function fetchVoiceCallSignals(
    callId: number,
    afterId: number
): Promise<{ signals: VoiceCallSignal[]; error?: string }> {
    const { data, error } = await apiFetch<{ signals: VoiceCallSignal[] }>(
        `/api/voice-calls/${callId}/signals?after=${afterId}`,
        { method: "GET", cache: "no-store" }
    );
    if (error) {
        return { signals: [], error: mapVoiceCallError(error) };
    }
    return { signals: data?.signals ?? [] };
}

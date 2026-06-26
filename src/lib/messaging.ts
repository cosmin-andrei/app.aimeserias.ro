import { apiFetch, getApiUrl } from "@/lib/api-client";
import { getAuthToken, handleSessionExpired, isAuthTokenValid } from "@/lib/auth";

export type MessageParticipant = {
    id: number;
    display_name: string;
    role: string;
    profile_picture: string | null;
    profession: string | null;
    worker_id: number | null;
    phone: string | null;
    is_blocked_by_me: boolean;
    is_blocked_by_other: boolean;
};

export type MessageItem = {
    id: number;
    conversation_id: number;
    sender_user_id: number;
    body: string;
    attachment_filename: string | null;
    attachment_original_name: string | null;
    attachment_mime: string | null;
    message_type: "text" | "image" | "document" | "maintenance_proposal";
    read_at: string | null;
    created_at: string;
    maintenance_proposal?: import("@/lib/maintenance-proposal").MaintenanceProposalItem | null;
};

export type ConversationItem = {
    id: number;
    client_user_id: number;
    worker_user_id: number;
    job_id: number | null;
    created_at: string;
    updated_at: string;
    other_user: MessageParticipant | null;
    last_message: MessageItem | null;
    unread_count: number;
    job_title: string | null;
};

export async function listConversations(): Promise<{
    data: ConversationItem[] | null;
    error?: string;
}> {
    const { data, error } = await apiFetch<{ conversations: ConversationItem[] }>(
        `/api/conversations?_=${Date.now()}`,
        { method: "GET", cache: "no-store" }
    );

    if (!data?.conversations) {
        return { data: null, error: error || "Eroare la încărcarea conversațiilor." };
    }

    return { data: data.conversations };
}

export function getTotalUnreadCount(conversations: ConversationItem[]): number {
    return conversations.reduce((sum, conversation) => sum + conversation.unread_count, 0);
}

export async function findOrCreateConversation(payload: {
    other_user_id: number;
    job_id?: number;
}): Promise<{
    data: ConversationItem | null;
    error?: string;
}> {
    const { data, error } = await apiFetch<{ conversation: ConversationItem }>(
        "/api/conversations",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );

    if (!data?.conversation) {
        return { data: null, error: error || "Nu s-a putut deschide conversația." };
    }

    return { data: data.conversation };
}

export async function getConversationMessages(conversationId: number): Promise<{
    data: { conversation: ConversationItem; messages: MessageItem[] } | null;
    error?: string;
}> {
    const { data, error } = await apiFetch<{
        conversation: ConversationItem;
        messages: MessageItem[];
    }>(`/api/conversations/${conversationId}/messages?_=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
    });

    if (!data) {
        return { data: null, error: error || "Eroare la încărcarea mesajelor." };
    }

    return { data };
}

export async function markConversationAsRead(
    conversationId: number
): Promise<{ success: boolean; error?: string }> {
    const { error, status } = await apiFetch(`/api/conversations/${conversationId}/read`, {
        method: "PATCH",
        body: JSON.stringify({}),
    });
    if (status >= 400) {
        return { success: false, error: error || "Nu s-a putut marca conversația ca citită." };
    }
    return { success: true };
}

export async function sendMessage(
    conversationId: number,
    body: string
): Promise<{ data: MessageItem | null; error?: string }> {
    const { data, error, status } = await apiFetch<{ message: MessageItem }>(
        `/api/conversations/${conversationId}/messages`,
        {
            method: "POST",
            body: JSON.stringify({ body }),
        }
    );

    if (!data?.message) {
        return {
            data: null,
            error: error || (status === 400 ? "Mesaj invalid." : "Trimiterea a eșuat."),
        };
    }

    return { data: data.message };
}

export const MESSAGE_DOCUMENT_ACCEPT =
    ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const MESSAGE_FILE_ACCEPT = `image/*,${MESSAGE_DOCUMENT_ACCEPT}`;

const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

export function validateMessageFile(file: File): string | null {
    if (file.type.startsWith("image/")) {
        return null;
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
    if (ext && ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
        return null;
    }

    return "Poți trimite doar imagini sau documente PDF / Word (.pdf, .doc, .docx).";
}

export function getMessageAttachmentPath(conversationId: number, messageId: number): string {
    return `/api/conversations/${conversationId}/messages/${messageId}/attachment`;
}

export async function fetchMessageAttachment(
    conversationId: number,
    messageId: number
): Promise<{ blob: Blob | null; error?: string }> {
    const token = getAuthToken();
    if (!token) {
        return { blob: null, error: "Nu ești autentificat." };
    }

    if (!isAuthTokenValid()) {
        handleSessionExpired();
        return { blob: null, error: "Sesiunea a expirat." };
    }

    try {
        const res = await fetch(
            `${getApiUrl()}${getMessageAttachmentPath(conversationId, messageId)}`,
            {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        if (!res.ok) {
            if (res.status === 401) {
                handleSessionExpired();
            }
            const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
            return {
                blob: null,
                error: mapAttachmentError(errBody?.error),
            };
        }

        return { blob: await res.blob() };
    } catch {
        return { blob: null, error: "Nu s-a putut încărca fișierul." };
    }
}

function mapAttachmentError(error?: string): string {
    switch (error) {
        case "Access denied.":
            return "Nu ai acces la acest fișier.";
        case "Conversation not found.":
        case "Message not found.":
        case "File not found.":
        case "No attachment.":
            return "Fișierul nu a fost găsit.";
        case "Only PDF and Word documents are allowed.":
            return "Poți trimite doar documente PDF sau Word.";
        default:
            return error || "Nu s-a putut încărca fișierul.";
    }
}

/** @deprecated Use fetchMessageAttachment — message files require conversation membership. */
export function getMessageAttachmentUrl(_filename: string | null): string | null {
    return null;
}

export function getMessagePreview(message: MessageItem | null | undefined): string {
    if (!message) return "Niciun mesaj încă";
    if (message.message_type === "maintenance_proposal") {
        return message.maintenance_proposal?.title
            ? `Programare: ${message.maintenance_proposal.title}`
            : "Programare mentenanță";
    }
    if (message.body?.trim()) return message.body;
    if (message.message_type === "image") return "Poză";
    if (message.message_type === "document") return "Document";
    return "Atașament";
}

export async function sendMessageAttachment(
    conversationId: number,
    file: File,
    caption?: string
): Promise<{ data: MessageItem | null; error?: string }> {
    const form = new FormData();
    form.append("file", file);
    const text = caption?.trim();
    if (text) form.append("body", text);

    const { data, error, status } = await apiFetch<{ message: MessageItem }>(
        `/api/conversations/${conversationId}/messages/attachment`,
        {
            method: "POST",
            body: form,
        }
    );

    if (!data?.message) {
        return {
            data: null,
            error: mapAttachmentError(error) || (status === 400 ? "Fișier invalid." : "Trimiterea a eșuat."),
        };
    }

    return { data: data.message };
}

export type ReportReason = "spam" | "harassment" | "fraud" | "inappropriate" | "other";

function mapSafetyError(error?: string, fallback = "Acțiunea nu a putut fi finalizată."): string {
    switch (error) {
        case "Only tradesperson accounts can be blocked from messaging.":
            return "Poți bloca doar conturi de meseriași.";
        case "Only tradesperson accounts can be reported from messaging.":
            return "Poți raporta doar conturi de meseriași.";
        case "Invalid report reason.":
            return "Motivul raportării nu este valid.";
        case "Please provide details for this report.":
            return "Adaugă detalii pentru acest raport.";
        case "You cannot block yourself.":
        case "You cannot report yourself.":
            return "Nu poți efectua această acțiune asupra contului tău.";
        case "User not found.":
            return "Utilizator negăsit.";
        default:
            return error || fallback;
    }
}

export async function blockUser(userId: number): Promise<{ success: boolean; error?: string }> {
    const { error, status } = await apiFetch(`/api/users/${userId}/block`, { method: "POST" });
    if (error) {
        return { success: false, error: mapSafetyError(error, status === 404 ? "Utilizator negăsit." : "Blocarea a eșuat.") };
    }
    return { success: true };
}

export async function unblockUser(userId: number): Promise<{ success: boolean; error?: string }> {
    const { error } = await apiFetch(`/api/users/${userId}/block`, { method: "DELETE" });
    if (error) {
        return { success: false, error: mapSafetyError(error, "Deblocarea a eșuat.") };
    }
    return { success: true };
}

export async function reportUser(
    userId: number,
    payload: { reason: ReportReason; details?: string; conversation_id?: number }
): Promise<{ success: boolean; error?: string }> {
    const { error, status } = await apiFetch(`/api/users/${userId}/report`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (error) {
        return {
            success: false,
            error: mapSafetyError(error, status === 404 ? "Utilizator negăsit." : "Raportarea a eșuat."),
        };
    }
    return { success: true };
}

export function formatPhoneTelHref(phone: string): string {
    const cleaned = phone.replace(/[\s()-]/g, "");
    if (cleaned.startsWith("+")) return `tel:${cleaned}`;
    if (cleaned.startsWith("00")) return `tel:+${cleaned.slice(2)}`;
    if (cleaned.startsWith("0")) return `tel:+4${cleaned}`;
    return `tel:${cleaned}`;
}

export function buildMesajeUrl(params: {
    conversationId?: number;
    otherUserId?: number;
    jobId?: number;
}): string {
    const search = new URLSearchParams();
    if (params.conversationId) search.set("c", String(params.conversationId));
    if (params.otherUserId) search.set("with", String(params.otherUserId));
    if (params.jobId) search.set("job", String(params.jobId));
    const query = search.toString();
    return query ? `/mesaje?${query}` : "/mesaje";
}

import type { MessageItem } from "@/lib/messaging";

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function formatDateSeparator(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) return "Astăzi";
    if (isSameDay(date, yesterday)) return "Ieri";

    return date.toLocaleDateString("ro-RO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
    });
}

export function groupMessagesByDate(messages: MessageItem[]) {
    const groups: { label: string; messages: MessageItem[] }[] = [];

    for (const message of messages) {
        const label = formatDateSeparator(message.created_at);
        const last = groups[groups.length - 1];

        if (!last || last.label !== label) {
            groups.push({ label, messages: [message] });
        } else {
            last.messages.push(message);
        }
    }

    return groups;
}

export function matchesConversationSearch(
    conversation: {
        other_user: { display_name?: string; profession?: string | null } | null;
        job_title: string | null;
        last_message: MessageItem | null;
    },
    query: string,
    getPreview: (message: MessageItem | null | undefined) => string
) {
    const haystack = [
        conversation.other_user?.display_name,
        conversation.other_user?.profession,
        conversation.job_title,
        getPreview(conversation.last_message),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return haystack.includes(query);
}

const THREAD_POLL_MS = 1500;

export { THREAD_POLL_MS };

function messagesEqual(a: MessageItem, b: MessageItem): boolean {
    return (
        a.id === b.id &&
        a.read_at === b.read_at &&
        a.body === b.body &&
        a.message_type === b.message_type &&
        a.attachment_filename === b.attachment_filename &&
        a.attachment_original_name === b.attachment_original_name &&
        a.maintenance_proposal?.status === b.maintenance_proposal?.status
    );
}

/** Unește mesajele de pe server cu cele locale (optimiste sau mai noi decât răspunsul). */
export function mergeThreadMessages(
    prev: MessageItem[],
    next: MessageItem[]
): MessageItem[] {
    const byId = new Map<number, MessageItem>();

    for (const message of next) {
        byId.set(message.id, message);
    }

    for (const message of prev) {
        if (message.id < 0 || !byId.has(message.id)) {
            byId.set(message.id, message);
            continue;
        }

        const serverMessage = byId.get(message.id)!;
        if (!serverMessage.read_at && message.read_at) {
            byId.set(message.id, { ...serverMessage, read_at: message.read_at });
        }
    }

    const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (
        merged.length === prev.length &&
        merged.every((message, index) => messagesEqual(message, prev[index]!))
    ) {
        return prev;
    }

    return merged;
}

import { apiFetch } from "@/lib/api-client";
import type { MessageItem } from "@/lib/messaging";

export type MaintenanceProposalStatus = "pending" | "accepted" | "declined" | "cancelled";

export type MaintenanceProposalItem = {
    id: number;
    conversation_id: number;
    worker_user_id: number;
    client_user_id: number;
    job_id: number | null;
    message_id: number | null;
    title: string;
    description: string | null;
    location: string | null;
    materials: string | null;
    starts_at: string;
    ends_at: string;
    status: MaintenanceProposalStatus;
    worker_calendar_event_id: number | null;
    client_calendar_event_id: number | null;
    responded_at: string | null;
    created_at: string;
    updated_at: string;
    job_title?: string | null;
};

export type MaintenanceEligibleJob = {
    id: number;
    title: string;
    city: string;
    category: string;
    status: string;
    description: string;
};

export type MaintenanceProposalMessage = MessageItem & {
    message_type: "maintenance_proposal";
    maintenance_proposal: MaintenanceProposalItem | null;
};

export type CreateMaintenanceProposalPayload = {
    title: string;
    starts_at: string;
    ends_at: string;
    job_id?: number | null;
    description?: string;
    location?: string;
    materials?: string;
};

export async function listMaintenanceEligibleJobs(conversationId: number): Promise<{
    data: MaintenanceEligibleJob[] | null;
    error?: string;
}> {
    const { data, error } = await apiFetch<{ jobs: MaintenanceEligibleJob[] }>(
        `/api/conversations/${conversationId}/maintenance-proposals/eligible-jobs?_=${Date.now()}`,
        { method: "GET", cache: "no-store" }
    );

    if (!data?.jobs) {
        return { data: null, error: error || "Nu s-au putut încărca proiectele." };
    }

    return { data: data.jobs };
}

export async function createMaintenanceProposal(
    conversationId: number,
    payload: CreateMaintenanceProposalPayload
): Promise<{
    data: { proposal: MaintenanceProposalItem; message: MaintenanceProposalMessage } | null;
    error?: string;
}> {
    const { data, error, status } = await apiFetch<{
        proposal: MaintenanceProposalItem;
        message: MaintenanceProposalMessage;
    }>(`/api/conversations/${conversationId}/maintenance-proposals`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!data?.message) {
        return {
            data: null,
            error: error || (status === 400 ? "Date invalide." : "Programarea nu a putut fi trimisă."),
        };
    }

    return { data };
}

export async function acceptMaintenanceProposal(proposalId: number): Promise<{
    success: boolean;
    error?: string;
}> {
    const { error } = await apiFetch(`/api/maintenance-proposals/${proposalId}/accept`, {
        method: "PUT",
    });
    return { success: !error, error: error || undefined };
}

export async function declineMaintenanceProposal(proposalId: number): Promise<{
    success: boolean;
    error?: string;
}> {
    const { error } = await apiFetch(`/api/maintenance-proposals/${proposalId}/decline`, {
        method: "PUT",
    });
    return { success: !error, error: error || undefined };
}

export function formatMaintenanceDateRange(startsAt: string, endsAt: string): string {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const dateLabel = start.toLocaleDateString("ro-RO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: start.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
    const timeLabel = `${start.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}`;
    return `${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}, ${timeLabel}`;
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceProposalStatus, string> = {
    pending: "În așteptare",
    accepted: "Acceptată",
    declined: "Refuzată",
    cancelled: "Anulată",
};

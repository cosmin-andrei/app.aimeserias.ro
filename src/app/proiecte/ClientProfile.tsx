import { Briefcase, Calendar, CheckCircle2 } from "lucide-react";
import { ClientRating } from "@/components/listing/ClientRating";
import { UserAvatar } from "@/components/UserAvatar";
import { getClientTypeLabel } from "@/lib/project";
import type { ProjectClient } from "@/types/project";

type ClientProfileProps = {
    client: ProjectClient;
    variant?: "compact" | "card";
    embedded?: boolean;
};

function formatMemberSince(date: string) {
    return new Date(date).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
}

export function ClientProfile({ client, variant = "compact", embedded = false }: ClientProfileProps) {
    const typeLabel = getClientTypeLabel(client.type);

    if (variant === "card") {
        return (
            <div className="rounded-2xl border border-[#002050]/10 bg-white p-5 shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:bg-[#141414] dark:ring-white/[0.06]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9CA3AF]">
                    Publicat de
                </p>
                <div className="flex items-start gap-4">
                    <UserAvatar
                        src={client.avatar}
                        alt={client.name}
                        sizes="56px"
                        containerClassName="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[#002050]/10 dark:ring-white/[0.12]"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{client.name}</h3>
                            {client.verified && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#0060f0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0060f0] dark:bg-[#5b9fff]/15 dark:text-[#5b9fff]">
                                    <CheckCircle2 className="size-3" aria-hidden />
                                    Verificat
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-[#9CA3AF]">{typeLabel}</p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-[#E5E7EB]">{client.location}</p>
                    </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm dark:border-white/[0.08]">
                    <div>
                        <dt className="text-xs text-gray-500 dark:text-[#9CA3AF]">Rating</dt>
                        <dd className="mt-0.5">
                            <ClientRating
                                rating={client.rating}
                                reviewCount={client.reviewCount}
                                size="md"
                            />
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500 dark:text-[#9CA3AF]">Proiecte publicate</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-[#002050] dark:text-[#f1f6ff]">
                            <Briefcase className="size-4 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                            {client.projectsPublished}
                        </dd>
                    </div>
                    {!embedded && (
                        <div>
                            <dt className="text-xs text-gray-500 dark:text-[#9CA3AF]">Membru din</dt>
                            <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-[#002050] dark:text-[#f1f6ff]">
                                <Calendar className="size-4 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                                {formatMemberSince(client.memberSince)}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2.5 ${embedded ? "" : "border-t border-gray-100 pt-3"}`}
        >
            <UserAvatar
                src={client.avatar}
                alt={client.name}
                sizes="32px"
                containerClassName="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-[#002050]/10"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">{client.name}</p>
                    {client.verified && (
                        <CheckCircle2
                            className="size-2.5 shrink-0 text-[#0060f0]"
                            aria-label="Client verificat"
                        />
                    )}
                </div>
                <p className="truncate text-[10px] text-gray-500 dark:text-[#9CA3AF]">{typeLabel}</p>
            </div>
            <ClientRating
                rating={client.rating}
                reviewCount={client.reviewCount}
                size="sm"
                layout="stacked"
                showCount={client.reviewCount > 0}
            />
        </div>
    );
}

export default ClientProfile;

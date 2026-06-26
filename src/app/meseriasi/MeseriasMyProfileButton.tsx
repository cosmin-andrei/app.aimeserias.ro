"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { normalizeUserRole } from "@/lib/site";

export function MeseriasMyProfileButton() {
    const { user, loading } = useUser();
    const role = normalizeUserRole(user?.role);

    if (loading || !user || role !== "worker") return null;

    const href = "/meseriasi/eu";
    const label = "Vezi profilul meu";

    return (
        <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stroke bg-white px-2.5 py-1.5 text-xs font-medium text-dark shadow-sm transition-all hover:bg-gray-2 sm:text-sm dark:border-white/[0.1] dark:bg-[#0f0f11] dark:text-white dark:hover:bg-white/[0.06]"
        >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0060f0]/10 text-[#0060f0] dark:bg-[#5b9fff]/15 dark:text-[#5b9fff]">
                <UserRound className="h-3 w-3" aria-hidden />
            </span>
            {label}
        </Link>
    );
}

export default MeseriasMyProfileButton;

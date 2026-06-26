"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buildMesajeUrl } from "@/lib/messaging";
import { cn } from "@/lib/utils";

type OpenChatLinkProps = {
    otherUserId: number;
    jobId?: number;
    className?: string;
    children?: React.ReactNode;
    variant?: "primary" | "subtle" | "inline";
};

export function OpenChatLink({
    otherUserId,
    jobId,
    className,
    children,
    variant = "primary",
}: OpenChatLinkProps) {
    const href = buildMesajeUrl({ otherUserId, jobId });

    const base =
        variant === "primary"
            ? "flex w-full items-center justify-center gap-2 rounded-xl border border-[#002050]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#002050] transition-colors hover:border-[#0060f0]/30 hover:bg-[#fafcff] dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.06]"
            : variant === "inline"
              ? "inline-flex items-center gap-2 text-sm font-medium text-[#0060f0] transition-colors hover:underline dark:text-[#5b9fff]"
              : "flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-[#002050]/8 transition-colors hover:bg-[#fafcff] dark:bg-white/[0.04] dark:ring-white/[0.08] dark:hover:bg-white/[0.06]";

    return (
        <Link href={href} className={cn(base, className)}>
            {children ?? (
                <>
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                    Deschide chat
                </>
            )}
        </Link>
    );
}

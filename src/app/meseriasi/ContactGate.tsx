"use client";

import Link from "next/link";
import { Lock, LogIn, MessageCircle, UserPlus } from "lucide-react";
import { LOGIN_URL, REGISTER_URL } from "@/lib/auth-routes";

type ContactGateProps = {
    meseriasName: string;
    variant?: "card" | "inline";
};

export function ContactGate({ meseriasName, variant = "card" }: ContactGateProps) {
    const loginUrl = LOGIN_URL;
    const registerUrl = REGISTER_URL;

    const content = (
        <>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0060f0]/15 text-[#0060f0]">
                <Lock className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                    Pentru a vedea datele de contact sau a discuta în chat cu{" "}
                    <span className="font-medium text-gray-900 dark:text-white">{meseriasName}</span>, creează un cont
                    gratuit pe AiMeseriaș.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={registerUrl}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#002050] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#001040] dark:bg-[#f1f6ff] dark:text-[#08080a] dark:hover:bg-white"
                    >
                        <UserPlus className="h-4 w-4" aria-hidden />
                        Creează cont
                    </Link>
                    <Link
                        href={loginUrl}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#002050]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#002050] transition-colors hover:border-[#002050]/30 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white dark:hover:border-white/20"
                    >
                        <LogIn className="h-4 w-4" aria-hidden />
                        Autentificare
                    </Link>
                </div>
            </div>
        </>
    );

    if (variant === "inline") {
        return (
            <div className="flex gap-4 rounded-2xl border border-[#002050]/10 bg-[#fafcff] p-5 dark:border-white/[0.08] dark:bg-[#141414]">
                {content}
            </div>
        );
    }

    return (
        <aside
            className="rounded-2xl border border-[#002050]/10 bg-gradient-to-br from-[#fafcff] to-white p-6 shadow-sm dark:border-white/[0.08] dark:from-[#141414] dark:to-[#101012]"
            aria-label="Contact protejat"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">{content}</div>

            <div className="mt-5 space-y-3 border-t border-[#002050]/8 pt-5 dark:border-white/[0.08]">
                <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-[#002050]/8 dark:bg-white/[0.04] dark:ring-white/[0.08]">
                    <MessageCircle className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    <span className="select-none text-sm text-gray-400 blur-[3px]">07xx xxx xxx</span>
                    <Lock className="ml-auto h-3.5 w-3.5 text-gray-400" aria-hidden />
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-[#002050]/8 dark:bg-white/[0.04] dark:ring-white/[0.08]">
                    <MessageCircle className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    <span className="select-none text-sm text-gray-400 blur-[3px]">contact@exemplu.ro</span>
                    <Lock className="ml-auto h-3.5 w-3.5 text-gray-400" aria-hidden />
                </div>
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-[#9CA3AF]">
                După autentificare vei putea trimite mesaje direct în chat și vei vedea datele de contact.
            </p>
        </aside>
    );
}

export default ContactGate;

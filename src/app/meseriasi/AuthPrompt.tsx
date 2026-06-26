"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { LOGIN_URL, REGISTER_URL } from "@/lib/auth-routes";

type AuthButtonsProps = {
    loginUrl?: string;
    registerUrl?: string;
    layout?: "row" | "stack";
    className?: string;
};

export function AuthButtons({
    loginUrl = LOGIN_URL,
    registerUrl = REGISTER_URL,
    layout = "row",
    className = "",
}: AuthButtonsProps) {
    const layoutClass =
        layout === "stack"
            ? "flex w-full flex-col gap-2"
            : "flex flex-wrap gap-2";

    return (
        <div className={`${layoutClass} ${className}`}>
            <Link
                href={registerUrl}
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#002050] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#001040] ${layout === "stack" ? "w-full" : ""}`}
            >
                <UserPlus className="h-4 w-4" aria-hidden />
                Creează cont
            </Link>
            <Link
                href={loginUrl}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#002050]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#002050] shadow-sm transition-colors hover:border-[#002050]/30 hover:bg-[#fafcff] dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.06] ${layout === "stack" ? "w-full" : ""}`}
            >
                <LogIn className="h-4 w-4" aria-hidden />
                Autentificare
            </Link>
        </div>
    );
}

type GatedOverlayProps = {
    loginUrl?: string;
    registerUrl?: string;
    message?: string;
    children: ReactNode;
    minHeight?: string;
    showAuthButtons?: boolean;
};

export function GatedOverlay({
    loginUrl = LOGIN_URL,
    registerUrl = REGISTER_URL,
    message,
    children,
    minHeight = "min-h-[140px]",
    showAuthButtons = true,
}: GatedOverlayProps) {
    return (
        <div className={`relative mt-3 overflow-hidden rounded-xl ring-1 ring-[#002050]/10 dark:ring-white/[0.08] ${minHeight}`}>
            <div className="pointer-events-none select-none p-2.5 opacity-50">{children}</div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/82 p-3 backdrop-blur-[3px] dark:bg-[#141414]/88">
                {message && (
                    <p className="max-w-[260px] text-center text-xs font-medium leading-snug text-gray-700 dark:text-[#9CA3AF] sm:text-sm">
                        {message}
                    </p>
                )}
                {showAuthButtons && (
                    <AuthButtons
                        loginUrl={loginUrl}
                        registerUrl={registerUrl}
                        layout="row"
                        className={`justify-center${message ? " mt-3" : ""}`}
                    />
                )}
            </div>
        </div>
    );
}

export default AuthButtons;

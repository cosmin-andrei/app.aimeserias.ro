"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastBannerProps = {
    variant: "error" | "success";
    message: string;
    onDismiss?: () => void;
};

export function ToastBanner({ variant, message, onDismiss }: ToastBannerProps) {
    const isError = variant === "error";

    return (
        <div
            role="alert"
            className={cn(
                "mb-3 flex shrink-0 items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm shadow-sm",
                isError
                    ? "border-red-200/80 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                    : "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
            )}
        >
            {isError ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <p className="min-w-0 flex-1 leading-snug">{message}</p>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
                    aria-label="Închide"
                >
                    <X className="size-3.5" aria-hidden />
                </button>
            )}
        </div>
    );
}

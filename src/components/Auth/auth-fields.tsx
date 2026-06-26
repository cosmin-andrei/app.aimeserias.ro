import { clsx } from "clsx";
import Link from "next/link";
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  errorId?: string;
  compact?: boolean;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ error, errorId, compact, className, ...props }, ref) {
    return (
      <div className={clsx("flex flex-col", compact ? "mb-1" : "mb-2")}>
        <input
          ref={ref}
          {...props}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-lg border bg-transparent px-[15px] py-[13px] text-base text-[#e8eaed] transition-all placeholder:text-[#9aa0a6] focus:outline-none",
            error
              ? "border-[#ea4335] focus:border-[#ea4335] focus:shadow-[0_0_0_1px_#ea4335]"
              : "border-[rgba(95,99,104,0.5)] focus:border-[#007bff] focus:shadow-[0_0_0_1px_#007bff]",
            className
          )}
        />
        <div
          id={errorId}
          className={clsx(
            "text-left text-[13px] text-[#ea4335]",
            error ? "mt-1 min-h-4" : compact ? "mt-0 min-h-0" : "mt-1.5 min-h-4"
          )}
        >
          {error}
        </div>
      </div>
    );
  }
);

export function AuthSubmitButton({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="min-w-[80px] rounded-lg bg-[#1a4d78] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#143f63] hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)] active:shadow-[0_1px_2px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed disabled:bg-[rgba(60,64,67,0.6)] disabled:text-[#9aa0a6]"
    >
      {loading ? "..." : children}
    </button>
  );
}

export function AuthBackButton({
  onClick,
  visible,
}: {
  onClick: () => void;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-transparent px-6 py-2.5 text-sm font-medium text-[#2eb8f0] transition hover:bg-[#2eb8f0]/10"
    >
      ← Înapoi
    </button>
  );
}

type AuthSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  errorId?: string;
  compact?: boolean;
};

export const AuthSelect = forwardRef<HTMLSelectElement, AuthSelectProps>(
  function AuthSelect({ error, errorId, compact, className, children, ...props }, ref) {
    return (
      <div className={clsx("flex w-full min-w-0 flex-col", compact ? "mb-1" : "mb-2")}>
        <select
          ref={ref}
          {...props}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-lg border bg-transparent px-[15px] py-[13px] text-base text-[#e8eaed] transition-all focus:outline-none [&>option]:bg-[#303134]",
            error
              ? "border-[#ea4335] focus:border-[#ea4335] focus:shadow-[0_0_0_1px_#ea4335]"
              : "border-[rgba(95,99,104,0.5)] focus:border-[#2eb8f0] focus:shadow-[0_0_0_1px_#2eb8f0]",
            className
          )}
        >
          {children}
        </select>
        <div
          id={errorId}
          className={clsx(
            "text-left text-[13px] text-[#ea4335]",
            error ? "mt-1 min-h-4" : "mt-0 min-h-0"
          )}
        >
          {error}
        </div>
      </div>
    );
  }
);

export function AuthLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "text-sm font-medium text-[#2eb8f0] no-underline hover:text-[#1aa3db]",
        className
      )}
    >
      {children}
    </Link>
  );
}

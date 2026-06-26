import { PUBLIC_LOGO } from "@/lib/assets";
import { clsx } from "clsx";
import Image from "next/image";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleStep?: number;
  stepDirection?: "forward" | "back";
  children: ReactNode;
  rightClassName?: string;
  containerClassName?: string;
};

export function AuthCard({
  title,
  subtitle,
  subtitleStep,
  stepDirection = "forward",
  children,
  rightClassName,
  containerClassName,
}: AuthCardProps) {
  const stepAnimation =
    stepDirection === "forward"
      ? "animate-auth-step-forward"
      : "animate-auth-step-back";

  return (
    <div
      className={clsx(
        "flex w-full max-w-[750px] flex-col items-start justify-center gap-6 rounded-2xl border border-[rgba(95,99,104,0.3)] bg-[#202124] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.3)] sm:gap-8 sm:p-8 md:flex-row md:items-start md:gap-[30px] md:p-10 md:pb-[30px]",
        containerClassName
      )}
    >
      <div className="flex w-full max-w-[300px] flex-col items-center md:items-start">
        <div className="mb-4 rounded-lg bg-white px-3 py-2 shadow-sm md:mb-5">
          <Image
            src={PUBLIC_LOGO}
            alt="AiMeseriaș"
            width={160}
            height={48}
            className="h-auto w-[110px] max-w-full object-contain sm:w-[130px]"
            priority
            unoptimized
          />
        </div>
        <h1 className="text-center text-2xl font-normal leading-tight text-white sm:text-[28px] md:text-left md:text-[32px]">
          {title}
        </h1>
        {subtitle ? (
          <p
            key={subtitleStep}
            className={clsx(
              "mt-2 min-h-[3rem] text-center text-base text-[#9aa0a6] md:text-left",
              stepAnimation
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div
        className={clsx(
          "flex w-full min-w-0 max-w-[400px] flex-1 flex-col md:pt-[95px]",
          rightClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

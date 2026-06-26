"use client";

import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { AuthSessionGuard } from "@/components/Auth/AuthSessionGuard";
import { CompanyAccountGuard } from "@/components/Auth/CompanyAccountGuard";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

function isAuthRoute(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

function isOnboardingRoute(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

function isFullHeightPage(pathname: string): boolean {
  return pathname === "/mesaje";
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const fullHeight = isFullHeightPage(pathname);

  if (isAuthRoute(pathname) || isOnboardingRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        fullHeight ? "h-screen overflow-hidden" : "min-h-screen"
      )}
    >
      <AuthSessionGuard />
      <CompanyAccountGuard />
      <Header />

      <div
        className={cn(
          "flex flex-1",
          fullHeight && "min-h-0 overflow-hidden"
        )}
      >
        <Sidebar />
        <main
          className={cn(
            "isolate flex min-w-0 w-full flex-1 flex-col bg-[#f5f5f7] dark:bg-[#08080a]",
            fullHeight && "min-h-0 overflow-hidden"
          )}
        >
          <div
            className={cn(
              "p-4 md:p-6 xl:p-8 2xl:p-10 3xl:px-12",
              fullHeight && "flex min-h-0 flex-1 flex-col"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { getAuthToken, handleSessionExpired, isAuthTokenValid } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function isAuthRoute(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

export function AuthSessionGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthRoute(pathname)) return;

    const checkSession = () => {
      const token = getAuthToken();
      if (token && !isAuthTokenValid()) {
        handleSessionExpired();
      }
    };

    checkSession();
    const interval = window.setInterval(checkSession, 60_000);
    return () => window.clearInterval(interval);
  }, [pathname]);

  return null;
}

"use client";

import { useEffect } from "react";
import { exchangeSsoToken } from "@/lib/auth-client";

function getSsoTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("ssoToken");
}

/**
 * Hook – schimbă ssoToken din URL cu JWT și șterge parametrul din URL.
 * Folosește în layout-ul principal (printr-o componentă client) ca să tratezi
 * ?ssoToken= după ce utilizatorul revine de la SSO.
 */
export function useSsoToken(): void {
  useEffect(() => {
    const ssoToken = getSsoTokenFromUrl();
    if (!ssoToken) return;

    (async () => {
      const result = await exchangeSsoToken(ssoToken);
      if (result.success) {
        const url = new URL(window.location.href);
        url.searchParams.delete("ssoToken");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    })();
  }, []);
}

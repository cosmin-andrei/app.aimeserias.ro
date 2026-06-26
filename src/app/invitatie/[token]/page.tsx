"use client";

import { getAuthServerUrl } from "@/lib/auth-client";
import { useParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirectează la formularul de finalizare înregistrare de pe SSO.
 * Formularul este deservit de SSO (GET /invite/:token), nu de ContulMeu.
 */
export default function InvitatieRedirectPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : null;

  useEffect(() => {
    if (!token) return;
    const base = getAuthServerUrl();
    window.location.replace(`${base}/invite/${encodeURIComponent(token)}`);
  }, [token]);

  if (!token) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4">
        <p className="text-dark-5 dark:text-[#9CA3AF]">Link invalid.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <p className="text-dark-5 dark:text-[#9CA3AF]">Redirecționare la formularul de înregistrare...</p>
    </div>
  );
}

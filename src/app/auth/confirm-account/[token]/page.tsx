"use client";

import { AuthCard } from "@/components/Auth/AuthCard";
import { AuthLink } from "@/components/Auth/auth-fields";
import { confirmAccount } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfirmAccountPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link de confirmare invalid.");
      return;
    }

    confirmAccount(token).then((result) => {
      if (result.success) {
        setStatus("success");
        setMessage(result.message || "Cont confirmat cu succes.");
        setTimeout(() => router.push("/auth/sign-in"), 3000);
      } else {
        setStatus("error");
        setMessage(result.error || "Confirmare eșuată.");
      }
    });
  }, [token, router]);

  return (
    <AuthCard
      title={
        <>
          Confirmare
          <br />
          cont
        </>
      }
      rightClassName="md:pt-8"
    >
      <div className="text-left text-base text-[#9aa0a6]">
        {status === "loading" && <p>Se confirmă contul...</p>}
        {status === "success" && (
          <>
            <p className="text-[#34a853]">{message}</p>
            <p className="mt-4 text-sm">Vei fi redirecționat la autentificare...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-[#ea4335]">{message}</p>
            <AuthLink href="/auth/sign-in" className="mt-4 inline-block">
              Înapoi la autentificare
            </AuthLink>
          </>
        )}
      </div>
    </AuthCard>
  );
}

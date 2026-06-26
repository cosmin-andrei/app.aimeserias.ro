import { redirect } from "next/navigation";

/**
 * Administrarea (Conturi, Roluri, Aplicații, Audit, Anunțuri) s-a mutat în AdminHub.
 * Redirecționare către AdminHub.
 */
export default function AdministrarePage() {
  const base = process.env.NEXT_PUBLIC_ADMINHUB_URL || "https://adminhub.onedu.ro";
  redirect(base.startsWith("http") ? base : `https://${base}`);
}

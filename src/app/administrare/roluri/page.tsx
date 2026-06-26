import { redirect } from "next/navigation";

/**
 * Rolurile se gestionează în AdminHub.
 */
export default function AdministrareRoluriPage() {
  const base = (process.env.NEXT_PUBLIC_ADMINHUB_URL || "https://adminhub.onedu.ro").replace(/\/$/, "");
  redirect(`${base}/roluri`);
}

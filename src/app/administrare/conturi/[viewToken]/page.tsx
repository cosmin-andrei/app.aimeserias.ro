import { redirect } from "next/navigation";

/**
 * Detaliile contului se vizualizează în AdminHub.
 */
export default async function AdministrareConturiViewTokenPage({
  params,
}: {
  params: Promise<{ viewToken: string }>;
}) {
  const base = (process.env.NEXT_PUBLIC_ADMINHUB_URL || "https://adminhub.onedu.ro").replace(/\/$/, "");
  const { viewToken: token } = await params;
  redirect(`${base}/utilizatori/conturi/${encodeURIComponent(token)}`);
}

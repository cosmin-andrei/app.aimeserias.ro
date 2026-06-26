/** URL-ul site-ului public aimeserias.ro (marketing + proiecte/meseriași). */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aimeserias.ro").replace(
    /\/$/,
    ""
  );
}

export function sitePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export type AppUserRole = "client" | "worker";

export function normalizeUserRole(role?: string | null): AppUserRole | null {
  if (role === "client") return "client";
  if (role === "worker" || role === "company") return "worker";
  return null;
}

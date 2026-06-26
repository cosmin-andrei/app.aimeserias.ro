/**
 * URL de bază pentru imagini și media (setat în .env ca NEXT_PUBLIC_ASSETS_URL).
 * Exemplu: https://assets.onedu.ro
 */
const BASE = process.env.NEXT_PUBLIC_ASSETS_URL ?? "https://assets.onedu.ro";

/** Siglă și favicon locale – fișiere din /public */
export const PUBLIC_LOGO = "/logo.png";
export const PUBLIC_FAVICON = "/favicon.png";

/** Albastru deschis din siglă (textul „Ai”) */
export const BRAND_BLUE_LIGHT = "#2eb8f0";
export const BRAND_BLUE_LIGHT_HOVER = "#1aa3db";

/** Albastru închis din siglă (textul „Meseriaș”) */
export const BRAND_BLUE_DARK = "#1a4d78";
export const BRAND_BLUE_DARK_HOVER = "#143f63";

/** Returnează URL-ul complet pentru un path de pe assets (fără slash inițial). */
export function assetUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE.replace(/\/$/, "")}/${p}`;
}

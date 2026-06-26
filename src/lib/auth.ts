/**
 * Gestionare token JWT Meserias (cookie client-side, citit de middleware).
 *
 * .env.local:
 *   AUTH_COOKIE_NAME=meserias_jwt
 *   NEXT_PUBLIC_AUTH_COOKIE_NAME=meserias_jwt
 */

export const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "meserias_jwt";

const COOKIE_MAX_AGE_DAYS = 30;

function getCookieDomainAttribute(): string {
  const domain = (
    process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ||
    process.env.AUTH_COOKIE_DOMAIN ||
    ""
  ).trim();
  if (!domain) return "";
  return `; domain=${domain}`;
}

function buildAuthCookie(value: string, maxAge: number): string {
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:";
  return `${AUTH_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}${getCookieDomainAttribute()}`;
}

export interface JwtPayload {
  user_id?: number;
  email?: string;
  role?: string;
  exp?: number;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const name = AUTH_COOKIE_NAME + "=";
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name)) return trimmed.slice(name.length);
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = buildAuthCookie(token, maxAge);
}

export function clearAuthToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = buildAuthCookie("", 0);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

export function isAuthTokenValid(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return payload !== null && !isTokenExpired(payload);
}

export function redirectToLogin(returnUrl?: string): void {
  if (typeof window === "undefined") return;
  clearAuthToken();
  const path =
    returnUrl ??
    `${window.location.pathname}${window.location.search}`;
  const url = `/auth/sign-in?returnUrl=${encodeURIComponent(path)}`;
  window.location.replace(url);
}

/** Curăță sesiunea și redirecționează la login (evită bucla pe rutele /auth). */
export function handleSessionExpired(returnUrl?: string): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/auth")) {
    clearAuthToken();
    return;
  }
  redirectToLogin(returnUrl);
}

/**
 * Helper pentru autentificare SSO în ContulMeu (Next.js).
 * Schimbă ssoToken în JWT și setează cookie-ul citit de middleware.
 *
 * .env.local:
 *   AUTH_SERVER_URL=https://auth.onedu.ro
 *   AUTH_APP_TOKEN=<app_token din scripts/add-contulmeu-client.js>
 *   AUTH_COOKIE_NAME=onedu_jwt  (opțional, același ca în middleware)
 */

const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "meserias_jwt";
const COOKIE_MAX_AGE_DAYS = 30;

export function getAuthServerUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTH_SERVER_URL || "http://localhost:4000"
  ).replace(/\/$/, "");
}

/**
 * Citește JWT-ul din cookie (pentru trimitere la SSO în header Authorization).
 * Util pentru apeluri către AUTH_SERVER_URL/auth/me etc.
 */
export function getJwtFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const name = AUTH_COOKIE_NAME + "=";
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name)) return trimmed.slice(name.length);
  }
  return null;
}

/**
 * Redirecționează către pagina locală de login (înlocuiește vechiul redirect SSO).
 */
export function redirectToSsoLogin(serviceURL?: string): string {
  let returnUrl = "/";
  if (serviceURL) {
    try {
      const parsed = new URL(serviceURL);
      returnUrl = parsed.pathname + parsed.search;
    } catch {
      returnUrl = serviceURL.startsWith("/") ? serviceURL : "/";
    }
  } else if (typeof window !== "undefined") {
    returnUrl = window.location.pathname + window.location.search;
  }
  const url = `/auth/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`;
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
  return url;
}

export interface ExchangeResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    avatar: null;
    appAccess: unknown[];
  };
  token?: string;
  error?: string;
}

/**
 * Schimbă ssoToken (din query) cu JWT prin GET /verifytoken și setează cookie.
 * Apelată din client (useEffect) când există ?ssoToken= în URL.
 */
export async function exchangeSsoToken(ssoToken: string): Promise<ExchangeResult> {
  const authUrl = getAuthServerUrl();
  const appToken = process.env.NEXT_PUBLIC_AUTH_APP_TOKEN;
  if (!appToken) {
    return { success: false, error: "AUTH_APP_TOKEN not configured" };
  }
  const res = await fetch(
    `${authUrl}/verifytoken?ssoToken=${encodeURIComponent(ssoToken)}`,
    { headers: { Authorization: `Bearer ${appToken}` } }
  );
  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    user?: ExchangeResult["user"];
    message?: string;
  };
  if (!res.ok || !data.token) {
    return {
      success: false,
      error: data.message || "Token invalid sau expirat.",
    };
  }
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:";
  document.cookie = `${AUTH_COOKIE_NAME}=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
  return { success: true, user: data.user, token: data.token };
}

/** Vizibilitate: cine poate vedea (gen / email / telefon) */
export type VisibilityValue = "everyone" | "onedu_network" | "platforms_with_profile" | "me_only";

/** Email din profil */
export interface SsoEmail {
  id: string;
  email: string;
  isPrimary: boolean;
  verified: boolean;
  visibility?: VisibilityValue;
  /** Consimțământ pentru newsletter pe acest email */
  newsletter?: boolean;
  /** Abonare la newsletter solicitată, în așteptarea confirmării prin email */
  newsletterPendingConfirmation?: boolean;
}

/** Telefon din profil */
export interface SsoPhone {
  id: string;
  phone: string;
  isPrimary: boolean;
  verified: boolean;
  visibility?: VisibilityValue;
}

/** Tip adresă: domiciliu (din buletin) sau reședință (adresa la care locuiești în prezent). postala e acceptat pentru compatibilitate. */
export type AddressType = "domiciliu" | "resedinta" | "postala";

/** Adresă din profil */
export interface SsoAddress {
  id: string;
  /** domiciliu | resedinta | postala | null (vechi) */
  addressType?: AddressType | null;
  street: string | null;
  number: string | null;
  block: string | null;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  city: string | null;
  county: string | null;
  isPrimary: boolean;
}

/**
 * Nume afișat public: din displayName (venit de la SSO).
 */
export function getPublicDisplayName(profile: { displayName?: string; name?: string } | null): string {
  if (!profile) return "";
  const name = (profile.displayName || "").trim();
  if (name) return name;
  return (profile.name || "").trim() || "";
}

/** Profil utilizator returnat de SSO GET /auth/me */
export interface SsoProfile {
  id: string;
  /** Nume legal complet (prenume + nume), folosit în iVoluntar etc. */
  name: string;
  /** Nume afișat public (după setarea utilizatorului) */
  displayName?: string;
  username: string;
  email: string;
  role: string;
  /** URL imagine profil; dacă lipsește, se afișează inițialele din numele public */
  avatar: string | null;
  /** Calea relativă a avatarului (ex. userId/abc.jpg); folosită pentru cache-busting la afișare */
  avatar_path?: string | null;
  /** Vizibilitate avatar: me_only | onedu_network | everyone */
  avatar_visibility?: VisibilityValue | null;
  appAccess: unknown[];
  prenume?: string;
  nume?: string;
  gen?: string | null;
  gen_visibility?: VisibilityValue | null;
  data_nasterii?: string | null;
  data_nasterii_visibility?: VisibilityValue | null;
  /** Verificare în doi pași prin email la conectare */
  two_factor_email?: boolean;
  telefon?: string | null;
  emails?: SsoEmail[];
  phones?: SsoPhone[];
  addresses?: SsoAddress[];
  registration_type?: "individual" | "company";
  is_company_account?: boolean;
  is_company_active?: boolean;
  company_status?: string | null;
  company_name?: string | null;
}

/** Câmpuri editabile prin PUT /auth/profile */
export interface SsoProfileUpdate {
  nume?: string | null;
  prenume?: string | null;
  display_name?: string | null;
  gen?: string | null;
  gen_visibility?: VisibilityValue | null;
  avatar_visibility?: VisibilityValue | null;
  data_nasterii?: string | null;
  data_nasterii_visibility?: VisibilityValue | null;
  two_factor_email?: boolean;
  telefon?: string | null;
}

/**
 * Încarcă profilul utilizatorului curent de la SSO (GET /auth/me).
 * Folosește JWT-ul din cookie. Returnează null dacă nu e autentificat sau request-ul eșuează.
 */
export async function fetchSsoProfile(): Promise<SsoProfile | null> {
  if (typeof window === "undefined") return null;
  const jwt = getJwtFromCookie();
  if (!jwt) return null;
  try {
    const res = await fetch(`${getAuthServerUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: SsoProfile };
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** Un element din activitatea de securitate (conectări, reset parolă, etc.) */
export interface SecurityActivityItem {
  id: string;
  type: string;
  details: string;
  ip: string | null;
  date: string;
  icon: "check" | "info";
}

/**
 * Încarcă activitatea de securitate recentă (GET /api/users/me/security-activity).
 * days: doar evenimente din ultimele N zile (implicit 30).
 */
export async function getSecurityActivity(options?: { limit?: number; days?: number }): Promise<{
  activities: SecurityActivityItem[];
  error?: string;
}> {
  if (typeof window === "undefined") return { activities: [] };

  const { getAuthToken } = await import("@/lib/auth");
  const token = getAuthToken();
  if (!token) return { activities: [], error: "Nu ești autentificat." };

  try {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    ).replace(/\/$/, "");
    const limit = options?.limit ?? 30;
    const days = Math.min(Math.max(options?.days ?? 30, 1), 90);
    const params = new URLSearchParams({
      limit: String(Math.min(limit, 50)),
      days: String(days),
    });
    const res = await fetch(`${apiUrl}/api/users/me/security-activity?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      activities?: SecurityActivityItem[];
      error?: string;
    };
    if (!res.ok) return { activities: [], error: data.error || "Eroare la încărcare." };
    return { activities: data.activities ?? [] };
  } catch (e) {
    return { activities: [], error: (e as Error).message };
  }
}

/** Sesiune activă (dispozitiv conectat) */
export interface SsoSession {
  id: string;
  clientId: string | null;
  clientName: string;
  createdAt: string | null;
  createdAtLabel: string | null;
  /** Adresa IP la conectare */
  ipAddress?: string | null;
  /** User-Agent la conectare */
  userAgent?: string | null;
  /** Label scurt: ex. "Chrome pe Windows 10" */
  deviceLabel?: string | null;
}

/**
 * Lista sesiunilor active (dispozitive conectate) – GET /api/users/me/sessions.
 */
export async function getSessions(): Promise<{
  sessions: SsoSession[];
  error?: string;
}> {
  if (typeof window === "undefined") return { sessions: [] };

  const { getAuthToken } = await import("@/lib/auth");
  const token = getAuthToken();
  if (!token) return { sessions: [], error: "Nu ești autentificat." };

  try {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    ).replace(/\/$/, "");
    const res = await fetch(`${apiUrl}/api/users/me/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      sessions?: SsoSession[];
      error?: string;
    };
    if (!res.ok) return { sessions: [], error: data.error || "Eroare la încărcare." };
    return { sessions: data.sessions ?? [] };
  } catch (e) {
    return { sessions: [], error: (e as Error).message };
  }
}

/**
 * Încheie o sesiune (deconectează dispozitivul) – DELETE /api/users/me/sessions/:sessionId.
 */
export async function revokeSession(sessionId: string): Promise<{
  success: boolean;
  message?: string;
  currentSessionRevoked?: boolean;
}> {
  if (typeof window === "undefined") return { success: false };
  if (sessionId === "legacy-current") {
    return { success: false, message: "Reconectează-te pentru a gestiona sesiunile." };
  }

  const { getAuthToken } = await import("@/lib/auth");
  const token = getAuthToken();
  if (!token) return { success: false, message: "Nu ești autentificat." };

  try {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    ).replace(/\/$/, "");
    const res = await fetch(
      `${apiUrl}/api/users/me/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      currentSessionRevoked?: boolean;
    };
    if (!res.ok) return { success: false, message: data.error || data.message || "Eroare." };
    return {
      success: true,
      message: data.message,
      currentSessionRevoked: data.currentSessionRevoked,
    };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Un cont din lista admin (GET /auth/admin/users). */
export interface AdminAccount {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastAuthAt: string;
  has2FA: boolean;
  appsCount: number;
  accountStatus: string;
  /** Cont în așteptare (invitație nefinalizată). */
  isPendingInvitation?: boolean;
  /** Token invitație – pentru deschidere link formular finalizare pe SSO. */
  inviteToken?: string;
}

/**
 * Lista conturilor pentru administrare – GET /auth/admin/users (doar pentru administratori).
 */
export async function getAdminUsers(): Promise<{
  accounts: AdminAccount[];
  error?: string;
}> {
  if (typeof window === "undefined") return { accounts: [] };
  try {
    const res = await authFetch("/auth/admin/users", { method: "GET", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { accounts?: AdminAccount[]; message?: string };
    if (!res.ok) return { accounts: [], error: data.message || "Eroare la încărcarea conturilor." };
    return { accounts: data.accounts ?? [] };
  } catch (e) {
    return { accounts: [], error: (e as Error).message };
  }
}

/** Detalii cont pentru administrare – GET /auth/admin/users/by-token/:token (profil complet) */
export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  prenume?: string;
  nume?: string;
  display_name?: string | null;
  role: string;
  roleLabel: string;
  verified: boolean;
  two_factor_email: boolean;
  created_at: string;
  lastAuthAt: string;
  sessionsCount: number;
  accountStatus: string;
  appAccess: Array<{ client_id: string; client_name: string }>;
  /** Cont suspendat (by-token) */
  suspended?: boolean;
  /** Profil complet (by-token) */
  gen?: string | null;
  gen_visibility?: VisibilityValue | null;
  data_nasterii?: string | null;
  data_nasterii_visibility?: VisibilityValue | null;
  telefon?: string | null;
  avatar?: string | null;
  avatar_visibility?: VisibilityValue | null;
  emails?: SsoEmail[];
  phones?: SsoPhone[];
  addresses?: SsoAddress[];
}

export async function getAdminUserDetail(userId: string): Promise<{
  detail: AdminUserDetail | null;
  error?: string;
}> {
  if (typeof window === "undefined") return { detail: null };
  try {
    const res = await authFetch(`/auth/admin/users/${encodeURIComponent(userId)}`, { method: "GET", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as AdminUserDetail & { message?: string };
    if (!res.ok) return { detail: null, error: data.message || "Eroare la încărcarea detaliilor." };
    return { detail: data as AdminUserDetail };
  } catch (e) {
    return { detail: null, error: (e as Error).message };
  }
}

/**
 * Emite un token efemer pentru a deschide pagina de detalii cont fără ID în URL.
 * Folosește tokenul în URL: /administrare/conturi/[token]
 */
export async function getAdminUserViewToken(userId: string): Promise<{ token: string | null; error?: string }> {
  if (typeof window === "undefined") return { token: null };
  try {
    const res = await authFetch(`/auth/admin/users/${encodeURIComponent(userId)}/view-token`, { method: "POST", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
    if (!res.ok) return { token: null, error: data.message || "Eroare la generarea linkului." };
    return { token: data.token ?? null };
  } catch (e) {
    return { token: null, error: (e as Error).message };
  }
}

/**
 * Încarcă detaliile contului pe baza token-ului efemer din URL (fără a expune ID-ul).
 */
export async function getAdminUserDetailByToken(token: string): Promise<{
  detail: AdminUserDetail | null;
  error?: string;
}> {
  if (typeof window === "undefined") return { detail: null };
  try {
    const res = await authFetch(`/auth/admin/users/by-token/${encodeURIComponent(token)}`, { method: "GET", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as AdminUserDetail & { message?: string };
    if (!res.ok) return { detail: null, error: data.message || "Token invalid sau expirat." };
    return { detail: data as AdminUserDetail };
  } catch (e) {
    return { detail: null, error: (e as Error).message };
  }
}

export async function updateAdminUserRole(userId: string, role: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(`/auth/admin/users/${encodeURIComponent(userId)}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la actualizarea rolului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function grantAdminUserAccess(userId: string, clientId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(`/auth/admin/users/${encodeURIComponent(userId)}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la acordarea accesului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function revokeAdminUserAccess(userId: string, clientId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(`/auth/admin/users/${encodeURIComponent(userId)}/access/${encodeURIComponent(clientId)}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la revocarea accesului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Actualizează profilul utilizatorului (admin, by token) cu opțiune de notificare email. */
export async function updateAdminUserProfileByToken(
  token: string,
  body: Partial<SsoProfileUpdate>,
  notifyEmail?: boolean
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(`/auth/admin/users/by-token/${encodeURIComponent(token)}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, notifyEmail: !!notifyEmail }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la actualizarea profilului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Marchează un email ca verificat (admin, by token). */
export async function adminConfirmEmailByToken(token: string, emailId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(
      `/auth/admin/users/by-token/${encodeURIComponent(token)}/email/${encodeURIComponent(emailId)}/verify`,
      { method: "PUT" }
    );
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la confirmarea email-ului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Marchează un telefon ca verificat (admin, by token). */
export async function adminConfirmPhoneByToken(token: string, phoneId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(
      `/auth/admin/users/by-token/${encodeURIComponent(token)}/phone/${encodeURIComponent(phoneId)}/verify`,
      { method: "PUT" }
    );
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la confirmarea telefonului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Suspendă sau reactivează cont (admin, by token). */
export async function adminSetSuspendedByToken(token: string, suspended: boolean): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(`/auth/admin/users/by-token/${encodeURIComponent(token)}/suspended`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la actualizarea statusului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Trimite link reset parolă către utilizator (admin). */
export async function adminSendPasswordReset(userId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(`/auth/admin/users/${encodeURIComponent(userId)}/send-password-reset`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la trimiterea linkului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Șterge cont utilizator (admin). Nu poate șterge propriul cont. */
export async function adminDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch(`/auth/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la ștergerea contului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Creează invitație (admin): trimite email cu link pentru finalizare înregistrare. */
export async function createAdminInvitation(payload: {
  prenume: string;
  nume: string;
  email: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch("/auth/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la crearea invitației." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Date invitație (public, fără auth) – pentru pagina de finalizare. */
export interface InvitationData {
  prenume: string;
  nume: string;
  email: string;
  role: string;
  inviterName: string;
}

export async function getInvitationByToken(token: string): Promise<{
  data: InvitationData | null;
  error?: string;
}> {
  try {
    const base = getAuthServerUrl();
    const res = await fetch(`${base}/auth/invitations/${encodeURIComponent(token)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as InvitationData & { message?: string };
    if (!res.ok) return { data: null, error: data.message || "Invitație invalidă sau expirată." };
    return { data: data as InvitationData };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

/** Finalizează înregistrarea pe baza invitației (public, fără auth). */
export async function completeInvitation(
  token: string,
  body: {
    data_nasterii: string;
    gen: string;
    password: string;
    newsletter?: boolean;
    telefon?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = getAuthServerUrl();
    const res = await fetch(`${base}/auth/invitations/${encodeURIComponent(token)}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la finalizare." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Permisiune asociată unui rol (GET /auth/admin/roles). */
export interface AdminRolePermission {
  id: string;
  label: string;
}

/** Un rol din lista admin (GET /auth/admin/roles). */
export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions?: AdminRolePermission[] | null;
  applications: unknown | null;
  accounts: number;
  /** true pentru roluri create din interfață (editabile). */
  isCustom?: boolean;
}

/** Roluri pentru dropdown-uri (creare invitație, schimbare rol). */
export const ADMIN_ROLE_OPTIONS = [
  { id: "user", name: "Utilizator" },
  { id: "administrator_conturi", name: "Administrator de conturi" },
  { id: "editor_anunturi", name: "Editor anunțuri" },
  { id: "administrator", name: "Administrator" },
  { id: "super_admin", name: "Super Administrator" },
] as const;

/** Verifică dacă rolul poate șterge sau suspenda conturi (doar Administrator / Super Administrator). */
export function canDeleteOrSuspend(role: string): boolean {
  const r = role === "editor" ? "administrator_conturi" : role;
  return r === "super_admin" || r === "administrator";
}

/** Verifică dacă rolul poate edita conturile de administrator (doar Super Administrator). */
export function canEditAdministrators(role: string): boolean {
  return (role === "editor" ? "administrator_conturi" : role) === "super_admin";
}

/**
 * Lista rolurilor pentru administrare – GET /auth/admin/roles (doar pentru administratori).
 */
export async function getAdminRoles(): Promise<{
  roles: AdminRole[];
  error?: string;
}> {
  if (typeof window === "undefined") return { roles: [] };
  try {
    const res = await authFetch("/auth/admin/roles", { method: "GET", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { roles?: AdminRole[]; message?: string };
    if (!res.ok) return { roles: [], error: data.message || "Eroare la încărcarea rolurilor." };
    return { roles: data.roles ?? [] };
  } catch (e) {
    return { roles: [], error: (e as Error).message };
  }
}

/**
 * Creează un rol custom – POST /auth/admin/roles (manage_roles).
 */
export async function createAdminRole(name: string, description?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch("/auth/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: (name ?? "").trim(),
        description: description != null ? String(description).trim() : "",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la crearea rolului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Actualizează un rol custom – PUT /auth/admin/roles/:id (manage_roles).
 */
export async function updateAdminRole(roleId: string, name: string, description?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`/auth/admin/roles/${encodeURIComponent(roleId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: (name ?? "").trim(),
        description: description != null ? String(description).trim() : "",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la actualizarea rolului." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** O aplicație din registrul admin (GET /auth/admin/applications). */
export interface AdminApplication {
  id: string;
  name: string;
  description: string;
  url: string;
  status: string;
  type: string;
}

/**
 * Lista aplicațiilor pentru administrare – GET /auth/admin/applications (doar pentru administratori).
 */
export async function getAdminApplications(): Promise<{
  applications: AdminApplication[];
  error?: string;
}> {
  if (typeof window === "undefined") return { applications: [] };
  try {
    const res = await authFetch("/auth/admin/applications", { method: "GET", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { applications?: AdminApplication[]; message?: string };
    if (!res.ok) return { applications: [], error: data.message || "Eroare la încărcarea aplicațiilor." };
    return { applications: data.applications ?? [] };
  } catch (e) {
    return { applications: [], error: (e as Error).message };
  }
}

/**
 * Creează o aplicație – POST /auth/admin/applications (admin).
 */
export async function createAdminApplication(payload: {
  name: string;
  description?: string;
  url?: string;
  type?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch("/auth/admin/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name.trim(),
        description: payload.description ?? "",
        url: payload.url ?? "",
        type: payload.type ?? "Privată",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la crearea aplicației." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Actualizează o aplicație – PUT /auth/admin/applications/:id (admin).
 */
export async function updateAdminApplication(
  applicationId: string,
  payload: { name?: string; description?: string; url?: string; type?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`/auth/admin/applications/${encodeURIComponent(applicationId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name?.trim(),
        description: payload.description,
        url: payload.url,
        type: payload.type,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, error: data.message || "Eroare la actualizarea aplicației." };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Un rând din logul de audit admin (GET /auth/admin/audit). */
export interface AdminAuditLog {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  email: string;
  action: string;
  ip: string;
  status: string;
}

/**
 * Loguri de audit pentru administrare – GET /auth/admin/audit (doar pentru administratori).
 * Query: limit (default 100, max 200), days (default 30, 1–90), user_id (opțional – filtrează după utilizator).
 */
export async function getAdminAudit(params?: { limit?: number; days?: number; user_id?: string }): Promise<{
  logs: AdminAuditLog[];
  error?: string;
}> {
  if (typeof window === "undefined") return { logs: [] };
  try {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.days != null) sp.set("days", String(params.days));
    if (params?.user_id) sp.set("user_id", params.user_id);
    const qs = sp.toString();
    const res = await authFetch(`/auth/admin/audit${qs ? `?${qs}` : ""}`, { method: "GET", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { logs?: AdminAuditLog[]; message?: string };
    if (!res.ok) return { logs: [], error: data.message || "Eroare la încărcarea logurilor de audit." };
    return { logs: data.logs ?? [] };
  } catch (e) {
    return { logs: [], error: (e as Error).message };
  }
}

/** Un anunț din lista admin (GET /auth/admin/announcements). */
export interface AdminAnnouncement {
  id: string;
  title: string;
  status: string;
  category: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Lista anunțurilor pentru administrare – GET /auth/admin/announcements (doar pentru administratori).
 */
export async function getAdminAnnouncements(): Promise<{
  announcements: AdminAnnouncement[];
  error?: string;
}> {
  const { getAdminAnnouncements: fetchAnnouncements } = await import("@/lib/api-client");
  return fetchAnnouncements();
}

/**
 * Lista anunțurilor active pentru dashboard – GET /api/announcements.
 */
export async function getAnnouncements(): Promise<{
  announcements: AdminAnnouncement[];
  error?: string;
}> {
  const { getAnnouncements: fetchAnnouncements } = await import("@/lib/api-client");
  return fetchAnnouncements();
}

/**
 * Creează anunț – POST /auth/admin/announcements (doar administrator).
 */
export async function createAdminAnnouncement(body: {
  title: string;
  status?: string;
  category?: string;
  content?: string;
}): Promise<{ id?: string; success: boolean; error?: string }> {
  const { createAdminAnnouncement: createAnnouncement } = await import("@/lib/api-client");
  return createAnnouncement(body);
}

/**
 * Actualizează anunț – PUT /auth/admin/announcements/:id (doar administrator).
 */
export async function updateAdminAnnouncement(
  id: string,
  body: { title?: string; status?: string; category?: string; content?: string }
): Promise<{ success: boolean; error?: string }> {
  const { updateAdminAnnouncement: updateAnnouncement } = await import("@/lib/api-client");
  return updateAnnouncement(id, body);
}

/**
 * Șterge anunț – DELETE /api/admin/announcements/:id (doar administrator).
 */
export async function deleteAdminAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  const { deleteAdminAnnouncement: removeAnnouncement } = await import("@/lib/api-client");
  return removeAnnouncement(id);
}

/**
 * Actualizează profilul utilizatorului via API-ul aplicației.
 */
export async function updateSsoProfile(
  body: SsoProfileUpdate
): Promise<{ success: boolean; user?: SsoProfile; message?: string }> {
  if (typeof window === "undefined") return { success: false };

  const { getAuthToken } = await import("@/lib/auth");
  const { updateUserProfile, appUserToProfile } = await import("@/lib/api-client");
  if (!getAuthToken()) return { success: false, message: "Nu ești autentificat." };

  const payload: import("@/lib/api-client").UserProfileUpdate = {};
  if (Object.prototype.hasOwnProperty.call(body, "gen")) {
    payload.gender = body.gen ?? null;
  }
  if (body.gen_visibility) {
    payload.gender_visibility = body.gen_visibility;
  }
  if (Object.prototype.hasOwnProperty.call(body, "data_nasterii")) {
    payload.birth_date = body.data_nasterii ?? null;
  }
  if (body.data_nasterii_visibility) {
    payload.birth_date_visibility = body.data_nasterii_visibility;
  }

  if (Object.keys(payload).length === 0) {
    return { success: false, message: "Nu există date de actualizat." };
  }

  const result = await updateUserProfile(payload);
  if (!result.success) {
    return { success: false, message: result.error ?? "Eroare la actualizare." };
  }
  return {
    success: true,
    user: result.user ? appUserToProfile(result.user) : undefined,
  };
}

/**
 * URL pentru afișarea avatarului: mereu prin ContulMeu (media proxy), nu direct de la SSO.
 * Astfel poza e servită de contulmeu.onedu.ro / localhost, nu de serverul SSO.
 * currentUserId = id-ul utilizatorului curent (pentru a ști dacă e propria poză).
 */
export function getAvatarDisplayUrl(
  profile: { id: string; avatar?: string | null; avatar_path?: string | null; avatar_visibility?: VisibilityValue | null } | null,
  _currentUserId?: string | null
): string | null {
  if (!profile?.avatar) return null;
  const v = (profile.avatar_path || profile.avatar || "").toString();
  return `/media/avatar/${profile.id}?v=${encodeURIComponent(v)}`;
}

/**
 * Încarcă poza de profil (JPEG/PNG/WebP/GIF, max 5MB) via API-ul aplicației.
 */
export async function uploadAvatar(
  file: File
): Promise<{ success: boolean; avatar?: string; message?: string }> {
  if (typeof window === "undefined") return { success: false };

  const { getAuthToken } = await import("@/lib/auth");
  const { getApiUrl, getProfilePictureUrl } = await import("@/lib/api-client");
  const token = getAuthToken();
  if (!token) return { success: false, message: "Nu ești autentificat." };

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: "Fișierul este prea mare (max 5MB)." };
  }

  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch(`${getApiUrl()}/api/users/profile-picture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = (await res.json().catch(() => ({}))) as {
      profile_picture?: string;
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      return {
        success: false,
        message: data.error || data.message || "Eroare la încărcare.",
      };
    }
    const avatarUrl = data.profile_picture
      ? getProfilePictureUrl(data.profile_picture) ?? undefined
      : undefined;
    return { success: true, avatar: avatarUrl };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const jwt = getJwtFromCookie();
  if (!jwt) return Promise.reject(new Error("Nu ești autentificat."));
  const url = `${getAuthServerUrl()}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...options.headers,
    },
  });
}

/**
 * Solicită trimiterea unui link de schimbare/resetare parolă pe email.
 * Nu necesită JWT – se apelează cu emailul utilizatorului (ex: din Setări).
 * Linkul expiră în 1 oră; utilizatorul deschide linkul pe SSO și setează parola nouă.
 */
export async function requestPasswordResetLink(
  email: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${getAuthServerUrl()}/auth/reset-password`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare la trimitere." };
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Opțiuni la adăugare email: vizibilitate și abonare newsletter. */
export interface AddEmailOptions {
  visibility?: VisibilityValue;
  newsletter?: boolean;
}

/** Adaugă email secundar – POST /auth/email/add. La eroare de trimitere, emailul rămâne în listă ca neconfirmat. */
export async function addEmail(
  email: string,
  options?: AddEmailOptions
): Promise<{ success: boolean; message?: string; emailAdded?: boolean; sendFailed?: boolean }> {
  try {
    const body: { email: string; visibility?: string; newsletter?: boolean } = { email: email.trim() };
    if (options?.visibility) body.visibility = options.visibility;
    if (options?.newsletter !== undefined) body.newsletter = options.newsletter;
    const res = await authFetch("/auth/email/add", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      emailAdded?: boolean;
      sendFailed?: boolean;
    };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return {
      success: true,
      message: data.message,
      emailAdded: data.emailAdded,
      sendFailed: data.sendFailed,
    };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Retrimite linkul de confirmare – POST /api/users/me/resend-confirmation */
export async function resendEmailConfirmationLink(
  _emailId: string
): Promise<{ success: boolean; message?: string }> {
  const { resendAccountConfirmationEmail } = await import("@/lib/api-client");
  const result = await resendAccountConfirmationEmail();
  if (!result.success) {
    return { success: false, message: result.error ?? "Eroare." };
  }
  return { success: true, message: result.message };
}

/** Trimite cod verificare email – POST /api/users/me/email/send-verification */
export async function sendEmailVerification(
  _emailId: string
): Promise<{ success: boolean; message?: string }> {
  const { sendAccountEmailVerificationCode } = await import("@/lib/api-client");
  const result = await sendAccountEmailVerificationCode();
  if (!result.success) {
    return { success: false, message: result.error ?? "Eroare." };
  }
  return { success: true, message: result.message };
}

/** Verifică cod email – POST /api/users/me/email/verify */
export async function verifyEmailCode(
  _emailId: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  const { verifyAccountEmailCode } = await import("@/lib/api-client");
  const result = await verifyAccountEmailCode(code);
  if (!result.success) {
    return { success: false, message: result.error ?? "Eroare." };
  }
  return { success: true, message: "Email verificat." };
}

/** Șterge email – DELETE /auth/email/:id */
export async function deleteEmail(
  emailId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`/auth/email/${emailId}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Setează email primar – PUT /auth/email/:id/primary */
export async function setPrimaryEmail(
  emailId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`/auth/email/${emailId}/primary`, {
      method: "PUT",
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Solicită schimbarea emailului principal. Link de confirmare se trimite pe adresa curentă. */
export async function requestChangePrimaryEmail(
  newEmail: string
): Promise<{ success: boolean; message?: string; sendFailed?: boolean }> {
  try {
    const res = await authFetch("/auth/primary-email/request", {
      method: "POST",
      body: JSON.stringify({ newEmail: newEmail.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      sendFailed?: boolean;
    };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return {
      success: true,
      message: data.message,
      sendFailed: data.sendFailed,
    };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Adaugă telefon – POST /auth/phone */
export async function addPhone(
  phone: string
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const res = await authFetch("/auth/phone", {
      method: "POST",
      body: JSON.stringify({ phone: phone.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      id?: string;
      message?: string;
    };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true, id: data.id };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Trimite cod verificare telefon – POST /auth/phone/send-verification */
export async function sendPhoneVerification(
  phoneId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch("/auth/phone/send-verification", {
      method: "POST",
      body: JSON.stringify({ phoneId }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Verifică cod telefon – POST /auth/phone/verify */
export async function verifyPhoneCode(
  phoneId: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch("/auth/phone/verify", {
      method: "POST",
      body: JSON.stringify({ phoneId, code }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Setează vizibilitate email – PATCH /api/users/me */
export async function setEmailVisibility(
  _emailId: string,
  visibility: VisibilityValue
): Promise<{ success: boolean; message?: string }> {
  const { updateUserProfile } = await import("@/lib/api-client");
  const result = await updateUserProfile({ email_visibility: visibility });
  if (!result.success) {
    return { success: false, message: result.error ?? "Eroare." };
  }
  return { success: true };
}

/** Setează vizibilitate telefon – PATCH /api/users/me */
export async function setPhoneVisibility(
  _phoneId: string,
  visibility: VisibilityValue
): Promise<{ success: boolean; message?: string }> {
  const { updateUserProfile } = await import("@/lib/api-client");
  const result = await updateUserProfile({ phone_visibility: visibility });
  if (!result.success) {
    return { success: false, message: result.error ?? "Eroare." };
  }
  return { success: true };
}

/** Setează consimțământul pentru newsletter pe un email. La abonare (true) API trimite email de confirmare și returnează pendingConfirmation. */
export async function setEmailNewsletter(
  emailId: string,
  newsletter: boolean
): Promise<{ success: boolean; message?: string; pendingConfirmation?: boolean }> {
  try {
    const res = await authFetch(`/auth/email/${emailId}/newsletter`, {
      method: "PUT",
      body: JSON.stringify({ newsletter }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; pendingConfirmation?: boolean };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true, message: data.message, pendingConfirmation: data.pendingConfirmation };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Șterge telefon – DELETE /auth/phone/:id */
export async function deletePhone(
  phoneId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`/auth/phone/${phoneId}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Setează telefon primar – PUT /auth/phone/:id/primary */
export async function setPrimaryPhone(
  phoneId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`/auth/phone/${phoneId}/primary`, {
      method: "PUT",
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Payload adresă */
export interface AddressPayload {
  addressType?: AddressType | null;
  street?: string | null;
  number?: string | null;
  block?: string | null;
  entrance?: string | null;
  floor?: string | null;
  apartment?: string | null;
  city?: string | null;
  county?: string | null;
  isPrimary?: boolean;
}

/** Adaugă adresă – POST /auth/addresses */
export async function addAddress(
  payload: AddressPayload
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const res = await authFetch("/auth/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      id?: string;
      message?: string;
    };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true, id: data.id };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Actualizează adresă – PUT /auth/addresses/:id */
export async function updateAddress(
  addressId: string,
  payload: AddressPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`/auth/addresses/${addressId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/** Șterge adresă – DELETE /auth/addresses/:id */
export async function deleteAddress(
  addressId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`/auth/addresses/${addressId}`, {
      method: "DELETE",
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare." };
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

/**
 * Șterge contul utilizatorului (GDPR). După succes, șterge JWT din cookie.
 * Apelantul trebuie să redirecționeze utilizatorul (ex. la login).
 */
export async function deleteAccount(): Promise<{
  success: boolean;
  message?: string;
}> {
  if (typeof window === "undefined") return { success: false };
  try {
    const res = await authFetch("/auth/account", { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { success: false, message: data.message || "Eroare la ștergerea contului." };
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    return { success: true };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

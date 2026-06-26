/**
 * Client pentru api.aimeserias.ro – login, profil utilizator, apeluri autentificate.
 *
 * .env.local:
 *   NEXT_PUBLIC_API_URL=http://localhost:5000
 *   API_URL=http://localhost:5000  (server-side, opțional)
 */

import {
  decodeJwtPayload,
  getAuthToken,
  handleSessionExpired,
  isAuthTokenValid,
  isTokenExpired,
  clearAuthToken,
  type JwtPayload,
} from "@/lib/auth";
import type { SsoProfile, VisibilityValue } from "@/lib/auth-client";
import {
  mapCompanyLookupError,
  type CompanyLookupData,
} from "@/lib/company-lookup";

export interface AppUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string | null;
  birth_date: string | null;
  gender: string | null;
  profile_picture: string | null;
  role: string;
  subscription_plan?: string;
  is_confirmed: boolean;
  created_at: string | null;
  domain_studies_status?: "pending" | "approved" | "rejected" | null;
  domain_studies_rejection_reason?: string | null;
  domain_studies_submitted_at?: string | null;
  domain_studies_document?: string | null;
  domain_studies_specializations?: string[];
  studies_verified_specializations?: string[];
  has_domain_studies?: boolean;
  pfa_name?: string | null;
  pfa_cui?: string | null;
  pfa_registration_number?: string | null;
  pfa_address?: string | null;
  pfa_document?: string | null;
  pfa_status?: "pending" | "approved" | "rejected" | null;
  pfa_rejection_reason?: string | null;
  pfa_submitted_at?: string | null;
  has_pfa?: boolean;
  two_factor_email?: boolean;
  display_name?: string | null;
  email_visibility?: VisibilityValue | null;
  phone_visibility?: VisibilityValue | null;
  gender_visibility?: VisibilityValue | null;
  birth_date_visibility?: VisibilityValue | null;
  addresses?: UserAddressItem[];
  registration_type?: "individual" | "company";
  legal_representative_declared_at?: string | null;
  company_name?: string | null;
  company_cui?: string | null;
  company_reg_com?: string | null;
  company_legal_form?: string | null;
  company_address?: string | null;
  company_document?: string | null;
  company_registration_certificate?: string | null;
  company_rep_id_document?: string | null;
  company_rep_authorization_document?: string | null;
  company_status?: CompanyStatus | null;
  company_rejection_reason?: string | null;
  company_submitted_at?: string | null;
  company_approved_at?: string | null;
  company_payment_completed_at?: string | null;
  is_company_account?: boolean;
  is_company_active?: boolean;
}

export type CompanyStatus =
  | "onboarding"
  | "pending_review"
  | "rejected"
  | "pending_payment"
  | "active";

export type UserAddressType = "domiciliu" | "resedinta" | "postala";

export interface UserAddressItem {
  id: string;
  addressType?: UserAddressType | null;
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

export type AddressPayload = {
  addressType?: UserAddressType | null;
  street?: string | null;
  number?: string | null;
  block?: string | null;
  entrance?: string | null;
  floor?: string | null;
  apartment?: string | null;
  city?: string | null;
  county?: string | null;
  isPrimary?: boolean;
};

export interface LoginResult {
  success: boolean;
  access_token?: string;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  city?: string;
  birth_date?: string;
  gender?: string;
  role?: "client" | "worker";
  email_verification_token?: string;
  registration_type?: "individual" | "company";
  legal_representative_declaration?: boolean;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");
}

export function getProfilePictureUrl(filename: string | null): string | null {
  if (!filename) return null;
  return `${getApiUrl()}/static/uploads/${encodeURIComponent(filename)}`;
}

export function getUserDisplayName(user: AppUser | null): string {
  if (!user) return "";
  return `${user.first_name} ${user.last_name}`.trim();
}

export function getUserAvatarUrl(user: AppUser | null): string | null {
  if (!user?.profile_picture) return null;
  return getProfilePictureUrl(user.profile_picture);
}

/** Mapare către forma folosită de componentele existente (header, setări parțial). */
export function appUserToProfile(user: AppUser): SsoProfile {
  const legalName = getUserDisplayName(user);
  const displayName = user.display_name?.trim() || legalName;
  const emailVisibility = (user.email_visibility ?? "me_only") as VisibilityValue;
  const phoneVisibility = (user.phone_visibility ?? "me_only") as VisibilityValue;
  const genderVisibility = (user.gender_visibility ?? "me_only") as VisibilityValue;
  const birthDateVisibility = (user.birth_date_visibility ?? "me_only") as VisibilityValue;
  return {
    id: String(user.id),
    name: legalName,
    displayName,
    username: user.email,
    email: user.email,
    role: user.role,
    avatar: getUserAvatarUrl(user),
    appAccess: [],
    prenume: user.first_name,
    nume: user.last_name,
    telefon: user.phone,
    data_nasterii: user.birth_date,
    gen: user.gender,
    gen_visibility: genderVisibility,
    data_nasterii_visibility: birthDateVisibility,
    two_factor_email: !!user.two_factor_email,
    emails: [
      {
        id: "main",
        email: user.email,
        isPrimary: true,
        verified: user.is_confirmed,
        visibility: emailVisibility,
      },
    ],
    phones: [
      {
        id: "main",
        phone: user.phone,
        isPrimary: true,
        verified: false,
        visibility: phoneVisibility,
      },
    ],
    addresses: user.addresses?.map((address) => ({
      id: address.id,
      addressType: address.addressType,
      street: address.street,
      number: address.number,
      block: address.block,
      entrance: address.entrance,
      floor: address.floor,
      apartment: address.apartment,
      city: address.city,
      county: address.county,
      isPrimary: address.isPrimary,
    })),
    registration_type: user.registration_type,
    is_company_account: user.is_company_account,
    is_company_active: user.is_company_active,
    company_status: user.company_status,
    company_name: user.company_name,
  };
}

function mapAddressError(error?: string): string {
  switch (error) {
    case "Invalid address type.":
      return "Tip de adresă invalid.";
    case "Invalid county.":
      return "Județ invalid.";
    case "Locality is required.":
      return "Localitatea este obligatorie.";
    case "Street and number are required for domicile address.":
      return "Strada și numărul sunt obligatorii pentru adresa de domiciliu.";
    case "An address of this type already exists. Edit the existing one.":
      return "Există deja o adresă de acest tip. Editează adresa existentă.";
    case "Address not found.":
      return "Adresa nu a fost găsită.";
    case "Invalid address id.":
      return "Adresă invalidă.";
    default:
      return error || "Eroare la salvarea adresei.";
  }
}

export async function addAddress(
  payload: AddressPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error, status } = await apiFetch<{ address?: UserAddressItem }>(
    "/api/users/me/addresses",
    { method: "POST", body: JSON.stringify(payload) }
  );
  if (!data?.address || status >= 400) {
    return { success: false, error: mapAddressError(error) };
  }
  return { success: true, id: data.address.id };
}

export async function updateAddress(
  addressId: string,
  payload: AddressPayload
): Promise<{ success: boolean; error?: string }> {
  const { error, status } = await apiFetch(
    `/api/users/me/addresses/${encodeURIComponent(addressId)}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  if (status >= 400) {
    return { success: false, error: mapAddressError(error) };
  }
  return { success: true };
}

export async function deleteAddress(
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  const { error, status } = await apiFetch(
    `/api/users/me/addresses/${encodeURIComponent(addressId)}`,
    { method: "DELETE" }
  );
  if (status >= 400) {
    return { success: false, error: mapAddressError(error) };
  }
  return { success: true };
}

export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const res = await fetch(`${getApiUrl()}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      error?: string;
    };
    if (!res.ok || !data.access_token) {
      return {
        success: false,
        error: data.error || "Autentificare eșuată.",
      };
    }
    return { success: true, access_token: data.access_token };
  } catch {
    return { success: false, error: "Nu s-a putut contacta serverul API." };
  }
}

export async function registerUser(
  data: RegisterData
): Promise<RegisterResult> {
  try {
    const res = await fetch(`${getApiUrl()}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        role: data.role || "client",
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    if (!res.ok) {
      return { success: false, error: body.error || "Înregistrare eșuată." };
    }
    return {
      success: true,
      message:
        body.message || "Verifică emailul pentru a confirma contul.",
    };
  } catch {
    return { success: false, error: "Nu s-a putut contacta serverul API." };
  }
}

function mapEmailVerificationError(error?: string): string {
  switch (error) {
    case "Invalid email address.":
      return "Formatul adresei de email este invalid.";
    case "Email already exists.":
      return "Există deja un cont cu această adresă de email.";
    case "Please wait before requesting a new code.":
      return "Așteaptă un minut înainte de a solicita un cod nou.";
    case "Verification code is required.":
      return "Codul de verificare este obligatoriu.";
    case "Verification code expired or not found.":
    case "Verification code expired.":
      return "Codul a expirat. Solicită un cod nou.";
    case "Too many invalid attempts.":
      return "Prea multe încercări greșite. Solicită un cod nou.";
    case "Invalid verification code.":
      return "Codul introdus este incorect.";
    default:
      return error || "Eroare la verificarea emailului.";
  }
}

export async function sendRegisterEmailCode(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/api/users/email/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      dev_code?: string;
    };
    if (!res.ok) {
      return {
        success: false,
        error: mapEmailVerificationError(body.error),
      };
    }
    if (body.dev_code) {
      console.log(
        `[AiMeseriaș dev] Cod verificare pentru ${email.trim()}: ${body.dev_code}`
      );
    }
    return { success: true, message: body.message };
  } catch {
    return { success: false, error: "Nu s-a putut contacta serverul API." };
  }
}

export async function verifyRegisterEmailCode(
  email: string,
  code: string
): Promise<{
  success: boolean;
  verification_token?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${getApiUrl()}/api/users/email/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code: code.trim() }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      verification_token?: string;
      error?: string;
    };
    if (!res.ok) {
      return {
        success: false,
        error: mapEmailVerificationError(body.error),
      };
    }
    return {
      success: true,
      verification_token: body.verification_token,
    };
  } catch {
    return { success: false, error: "Nu s-a putut contacta serverul API." };
  }
}

export async function confirmAccount(
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/api/users/confirm-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    if (!res.ok) {
      return { success: false, error: body.error || "Confirmare eșuată." };
    }
    return { success: true, message: body.message };
  } catch {
    return { success: false, error: "Nu s-a putut contacta serverul API." };
  }
}

function getTokenEmail(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.email || isTokenExpired(payload)) return null;
  return payload.email;
}

/** Format acceptat: 07xxxxxxxx (10 cifre). */
const ROMANIAN_MOBILE_PHONE = /^07\d{8}$/;

/** Normalizează numărul introdus la format 07xxxxxxxx. Returnează "" dacă nu e valid. */
export function normalizePhoneForApi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("40") && digits.length === 11) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length === 9 && digits.startsWith("7")) {
    digits = `0${digits}`;
  }

  return ROMANIAN_MOBILE_PHONE.test(digits) ? digits : "";
}

function mapProfileUpdateError(error?: string): string {
  switch (error) {
    case "Invalid phone number.":
      return "Număr de telefon invalid. Folosește formatul 07xxxxxxxx.";
    case "No fields to update.":
    case "No valid fields to update.":
      return "Nu există date de actualizat.";
    case "Invalid city.":
      return "Oraș invalid.";
    case "Invalid subscription plan.":
      return "Planul selectat nu este valid.";
    case "Subscription plans are only available for worker accounts.":
      return "Abonamentele sunt disponibile doar pentru conturi de meseriaș.";
    case "Invalid first name.":
      return "Prenumele introdus nu este valid.";
    case "Invalid last name.":
      return "Numele introdus nu este valid.";
    case "Invalid display name.":
      return "Numele afișat public nu este valid.";
    case "Invalid gender. Accepted values are M or F.":
      return "Gen invalid.";
    case "Invalid birth date or the user must be at least 14 years old.":
      return "Data nașterii este invalidă sau trebuie să ai cel puțin 14 ani.";
    case "Invalid email visibility.":
    case "Invalid phone visibility.":
    case "Invalid gender visibility.":
    case "Invalid birth date visibility.":
      return "Setarea de vizibilitate nu este validă.";
    default:
      return error || "Eroare la actualizarea profilului.";
  }
}

export type UserProfileUpdate = {
  phone?: string;
  city?: string | null;
  subscription_plan?: string;
  two_factor_email?: boolean;
  first_name?: string;
  last_name?: string;
  display_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  email_visibility?: VisibilityValue;
  phone_visibility?: VisibilityValue;
  gender_visibility?: VisibilityValue;
  birth_date_visibility?: VisibilityValue;
};

export async function updateUserProfile(
  data: UserProfileUpdate
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const { data: body, error } = await apiFetch<{ message?: string; user?: AppUser }>(
    "/api/users/me",
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  if (!body?.user) {
    return { success: false, error: mapProfileUpdateError(error) };
  }

  return { success: true, user: body.user };
}

function mapDomainStudiesError(error?: string): string {
  switch (error) {
    case "Domain studies are only available for worker accounts.":
      return "Studiile în domeniu sunt disponibile doar pentru conturi de meseriaș.";
    case "A document is already pending review.":
      return "Există deja un document în curs de verificare.";
    case "Your domain studies are already approved.":
      return "Studiile în domeniu sunt deja aprobate.";
    case "File type not allowed. Use PDF, JPG or PNG.":
      return "Format neacceptat. Folosește PDF, JPG sau PNG.";
    case "No file provided.":
      return "Selectează un fișier.";
    case "At least one specialization is required.":
      return "Selectează cel puțin o specializare pentru document.";
    case "Too many specializations selected.":
      return "Prea multe specializări selectate.";
    case "Invalid specializations payload.":
      return "Datele specializărilor sunt invalide.";
    default:
      return error || "Eroare la încărcarea documentului.";
  }
}

export async function uploadDomainStudies(
  file: File,
  specializations: string[]
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: "Nu ești autentificat." };
  }

  if (specializations.length === 0) {
    return { success: false, error: "Selectează cel puțin o specializare pentru document." };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("specializations", JSON.stringify(specializations));

  try {
    const res = await fetch(`${getApiUrl()}/api/users/me/domain-studies`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = (await res.json().catch(() => ({}))) as {
      user?: AppUser;
      error?: string;
    };
    if (!res.ok || !body.user) {
      return { success: false, error: mapDomainStudiesError(body.error) };
    }
    return { success: true, user: body.user };
  } catch {
    return { success: false, error: "Eroare de rețea." };
  }
}

export type PfaPayload = {
  pfa_name: string;
  pfa_cui: string;
  pfa_registration_number: string;
  pfa_address: string;
};

function mapPfaError(error?: string): string {
  switch (error) {
    case "PFA is only available for worker accounts.":
      return "PFA este disponibilă doar pentru conturi de meseriaș.";
    case "PFA data is already pending review.":
      return "Datele PFA sunt deja în curs de verificare.";
    case "PFA document is required.":
      return "Documentul doveditor este obligatoriu.";
    case "Invalid PFA name.":
      return "Denumirea PFA este invalidă.";
    case "Invalid PFA CUI.":
      return "CUI-ul este invalid.";
    case "Invalid PFA registration number.":
      return "Numărul de înregistrare este invalid.";
    case "Invalid PFA address.":
      return "Adresa sediului social este invalidă.";
    case "File type not allowed. Use PDF, JPG or PNG.":
      return "Format neacceptat. Folosește PDF, JPG sau PNG.";
    default:
      return error || "Eroare la trimiterea datelor PFA.";
  }
}

export async function submitPfa(
  payload: PfaPayload,
  file?: File | null
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: "Nu ești autentificat." };
  }

  const formData = new FormData();
  formData.append("pfa_name", payload.pfa_name);
  formData.append("pfa_cui", payload.pfa_cui);
  formData.append("pfa_registration_number", payload.pfa_registration_number);
  formData.append("pfa_address", payload.pfa_address);
  if (file) formData.append("file", file);

  try {
    const res = await fetch(`${getApiUrl()}/api/users/me/pfa`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = (await res.json().catch(() => ({}))) as {
      user?: AppUser;
      error?: string;
    };
    if (!res.ok || !body.user) {
      return { success: false, error: mapPfaError(body.error) };
    }
    return { success: true, user: body.user };
  } catch {
    return { success: false, error: "Eroare de rețea." };
  }
}

export type CompanyVerificationPayload = {
  company_name: string;
  company_cui: string;
  company_reg_com: string;
  company_legal_form: string;
  company_address: string;
};

export type CompanyVerificationDocuments = {
  registrationCertificate?: File | null;
  repId?: File | null;
  repAuthorization?: File | null;
};

export async function fetchCompanyByCui(
  cui: string
): Promise<{
  success: boolean;
  data?: CompanyLookupData;
  meta?: { cached?: boolean; source?: string };
  error?: string;
}> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: "Nu ești autentificat." };
  }

  const normalized = cui.trim().replace(/^RO/i, "").replace(/\D/g, "");
  if (!/^\d{1,10}$/.test(normalized)) {
    return { success: false, error: "CUI invalid. Introdu între 1 și 10 cifre." };
  }

  try {
    const res = await fetch(`${getApiUrl()}/api/company/${normalized}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: CompanyLookupData;
      meta?: { cached?: boolean; source?: string };
      error?: string;
    };
    if (!res.ok || !body.success || !body.data) {
      return { success: false, error: mapCompanyLookupError(body.error) };
    }
    return { success: true, data: body.data, meta: body.meta };
  } catch {
    return { success: false, error: "Eroare de rețea." };
  }
}

function mapCompanyError(error?: string): string {
  switch (error) {
    case "Company verification is only available for company accounts.":
      return "Verificarea firmei este disponibilă doar pentru conturile de firmă.";
    case "Company draft is only available for company accounts.":
      return "Salvarea datelor firmei este disponibilă doar pentru conturile de companie.";
    case "Company data cannot be submitted in the current status.":
      return "Datele firmei nu pot fi trimise în starea actuală.";
    case "Company constitutive document is required.":
      return "Documentele constitutive sunt obligatorii.";
    case "Company registration certificate is required.":
      return "Certificatul de înregistrare este obligatoriu.";
    case "Representative ID document is required.":
      return "Actul de identitate al reprezentantului este obligatoriu.";
    case "Representative authorization document is required.":
      return "Dovada dreptului de reprezentare este obligatorie.";
    case "Invalid company name.":
      return "Denumirea firmei este invalidă.";
    case "Invalid company CUI.":
      return "CUI-ul firmei este invalid.";
    case "Invalid trade registry number.":
      return "Numărul din Registrul Comerțului este invalid.";
    case "Invalid legal form.":
      return "Forma juridică este invalidă.";
    case "Invalid company address.":
      return "Adresa sediului social este invalidă.";
    case "Company account is not ready for subscription activation.":
      return "Contul nu este încă pregătit pentru activarea abonamentului.";
    case "File type not allowed. Use PDF, JPG or PNG.":
      return "Format neacceptat. Folosește PDF, JPG sau PNG.";
    default:
      return error || "Eroare la trimiterea datelor firmei.";
  }
}

export async function saveCompanyDraft(
  payload: CompanyVerificationPayload
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const { data, error, status } = await apiFetch<{ user?: AppUser }>(
    "/api/users/me/company/draft",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  if (!data?.user || status >= 400) {
    return { success: false, error: mapCompanyError(error) };
  }
  return { success: true, user: data.user };
}

export async function submitCompanyVerification(
  payload: CompanyVerificationPayload,
  documents: CompanyVerificationDocuments,
  options?: { requiresRepAuthorization?: boolean }
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: "Nu ești autentificat." };
  }

  const formData = new FormData();
  formData.append("company_name", payload.company_name);
  formData.append("company_cui", payload.company_cui);
  formData.append("company_reg_com", payload.company_reg_com);
  formData.append("company_legal_form", payload.company_legal_form);
  formData.append("company_address", payload.company_address);
  if (options?.requiresRepAuthorization) {
    formData.append("requires_rep_authorization", "true");
  }
  if (documents.registrationCertificate) {
    formData.append("registration_certificate", documents.registrationCertificate);
  }
  if (documents.repId) {
    formData.append("rep_id", documents.repId);
  }
  if (documents.repAuthorization) {
    formData.append("rep_authorization", documents.repAuthorization);
  }

  try {
    const res = await fetch(`${getApiUrl()}/api/users/me/company`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = (await res.json().catch(() => ({}))) as {
      user?: AppUser;
      error?: string;
    };
    if (!res.ok || !body.user) {
      return { success: false, error: mapCompanyError(body.error) };
    }
    return { success: true, user: body.user };
  } catch {
    return { success: false, error: "Eroare de rețea." };
  }
}

export async function activateCompanySubscription(): Promise<{
  success: boolean;
  user?: AppUser;
  error?: string;
}> {
  const { data, error } = await apiFetch<{ user: AppUser }>(
    "/api/users/me/company/activate-subscription",
    { method: "POST" }
  );
  if (!data?.user) {
    return { success: false, error: mapCompanyError(error) };
  }
  return { success: true, user: data.user };
}

function mapEmailChangeError(error?: string): string {
  switch (error) {
    case "Invalid email address.":
      return "Formatul adresei de email este invalid.";
    case "Email already exists.":
      return "Există deja un cont cu această adresă de email.";
    case "This is already your email address.":
      return "Aceasta este deja adresa ta de email.";
    case "Please wait before requesting a new code.":
      return "Așteaptă un minut înainte de a solicita un cod nou.";
    case "Verification code is required.":
      return "Codul de verificare este obligatoriu.";
    case "Verification code expired or not found.":
    case "Verification code expired.":
      return "Codul a expirat. Solicită un cod nou.";
    case "Too many invalid attempts.":
      return "Prea multe încercări greșite. Solicită un cod nou.";
    case "Invalid verification code.":
      return "Codul introdus este incorect.";
    case "New email is required.":
      return "Adresa de email este obligatorie.";
    case "New email and verification code are required.":
      return "Emailul și codul de verificare sunt obligatorii.";
    default:
      return error || "Eroare la schimbarea emailului.";
  }
}

export async function sendEmailChangeCode(
  newEmail: string
): Promise<{ success: boolean; message?: string; dev_code?: string; error?: string }> {
  const { data: body, error } = await apiFetch<{
    message?: string;
    dev_code?: string;
  }>("/api/users/me/email/send-code", {
    method: "POST",
    body: JSON.stringify({ new_email: newEmail.trim() }),
  });

  if (!body) {
    return { success: false, error: mapEmailChangeError(error) };
  }

  if (body.dev_code && process.env.NODE_ENV !== "production") {
    console.info(
      `[AiMeseriaș dev] Cod schimbare email pentru ${newEmail}: ${body.dev_code}`
    );
  }

  return { success: true, message: body.message, dev_code: body.dev_code };
}

export async function confirmEmailChange(
  newEmail: string,
  code: string
): Promise<{
  success: boolean;
  user?: AppUser;
  access_token?: string;
  error?: string;
}> {
  const { data: body, error } = await apiFetch<{
    message?: string;
    user?: AppUser;
    access_token?: string;
  }>("/api/users/me/email/confirm-change", {
    method: "POST",
    body: JSON.stringify({
      new_email: newEmail.trim(),
      code: code.trim(),
    }),
  });

  if (!body?.user || !body.access_token) {
    return { success: false, error: mapEmailChangeError(error) };
  }

  return {
    success: true,
    user: body.user,
    access_token: body.access_token,
  };
}

function mapAccountEmailVerificationError(error?: string): string {
  switch (error) {
    case "Please wait before requesting a new code.":
      return "Așteaptă un minut înainte de a solicita un cod nou.";
    case "Verification code is required.":
      return "Codul de verificare este obligatoriu.";
    case "Verification code expired or not found.":
    case "Verification code expired.":
      return "Codul a expirat. Solicită un cod nou.";
    case "Too many invalid attempts.":
      return "Prea multe încercări greșite. Solicită un cod nou.";
    case "Invalid verification code.":
      return "Codul introdus este incorect.";
    case "Account is already confirmed.":
    case "Account already confirmed.":
      return "Emailul este deja verificat.";
    default:
      return error || "Eroare la verificarea emailului.";
  }
}

export async function sendAccountEmailVerificationCode(): Promise<{
  success: boolean;
  message?: string;
  dev_code?: string;
  error?: string;
}> {
  const { data: body, error } = await apiFetch<{
    message?: string;
    dev_code?: string;
  }>("/api/users/me/email/send-verification", {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!body) {
    return { success: false, error: mapAccountEmailVerificationError(error) };
  }

  if (body.dev_code && process.env.NODE_ENV !== "production") {
    console.info(`[AiMeseriaș dev] Cod verificare email cont: ${body.dev_code}`);
  }

  return { success: true, message: body.message, dev_code: body.dev_code };
}

export async function verifyAccountEmailCode(
  code: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const { data: body, error } = await apiFetch<{
    message?: string;
    user?: AppUser;
  }>("/api/users/me/email/verify", {
    method: "POST",
    body: JSON.stringify({ code: code.trim() }),
  });

  if (!body?.user) {
    return { success: false, error: mapAccountEmailVerificationError(error) };
  }

  return { success: true, user: body.user };
}

export async function resendAccountConfirmationEmail(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const { data: body, error } = await apiFetch<{ message?: string }>(
    "/api/users/me/resend-confirmation",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );

  if (!body) {
    return { success: false, error: mapAccountEmailVerificationError(error) };
  }

  return { success: true, message: body.message };
}

export async function fetchCurrentUser(): Promise<AppUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  if (!isAuthTokenValid()) {
    handleSessionExpired();
    return null;
  }

  const email = getTokenEmail(token);
  if (!email) {
    handleSessionExpired();
    return null;
  }

  try {
    const res = await fetch(
      `${getApiUrl()}/api/users/${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (res.status === 401) {
      handleSessionExpired();
      return null;
    }
    if (!res.ok) return null;
    return (await res.json()) as AppUser;
  } catch {
    return null;
  }
}

export async function deleteAccount(): Promise<{
  success: boolean;
  message?: string;
}> {
  const { data, error, status } = await apiFetch<{ message?: string }>("/api/users", {
    method: "DELETE",
  });

  if (status !== 200) {
    return {
      success: false,
      message: error || "Eroare la ștergerea contului.",
    };
  }

  clearAuthToken();
  return {
    success: true,
    message: data?.message || "Contul a fost șters.",
  };
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; status: number; error?: string }> {
  const token = getAuthToken();
  if (!token) {
    return { data: null, status: 401, error: "Nu ești autentificat." };
  }

  if (!isAuthTokenValid()) {
    handleSessionExpired();
    return { data: null, status: 401, error: "Sesiunea a expirat." };
  }

  const headers = new Headers(options.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      headers,
    });
    const data = (await res.json().catch(() => null)) as T | null;
    if (!res.ok) {
      if (res.status === 401) {
        handleSessionExpired();
      }
      const errBody = data as { error?: string } | null;
      return {
        data: null,
        status: res.status,
        error: errBody?.error || res.statusText,
      };
    }
    return { data, status: res.status };
  } catch {
    return { data: null, status: 0, error: "Eroare de rețea." };
  }
}

export function getJwtPayload(): JwtPayload | null {
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) return null;
  return payload;
}

export interface WorkerProfile {
  id: number;
  user_id: number;
  profession: string;
  description: string | null;
  experience_years: number | null;
  price: number | null;
  verified: boolean;
  average_rating: number;
  total_reviews: number;
  completed_jobs: number;
  specializations: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  registration_type?: string;
  has_pfa?: boolean;
  display_name?: string | null;
}

export interface CompanyTeamMember {
  worker_id: number;
  user_id: number;
  name: string;
  profession: string;
  profile_picture: string | null;
  average_rating: number;
  total_reviews: number;
  completed_jobs: number;
  verified: boolean;
  specializations: string | null;
}

export interface PublicCompanyProfile {
  id: number;
  company_name: string;
  company_cui: string | null;
  company_reg_com: string | null;
  company_legal_form: string | null;
  company_address: string | null;
  description: string | null;
  profession: string | null;
  cover_image: string | null;
  profile_picture: string | null;
  worker_count: number;
  city: string;
  phone: string | null;
  email: string | null;
  created_at: string | null;
  company_status: string | null;
  is_company_active: boolean;
  average_rating?: number;
  total_reviews?: number;
  completed_jobs?: number;
  verified?: boolean;
  members?: CompanyTeamMember[];
}

export interface MyWorkerProfileResponse {
  worker: WorkerProfile | null;
  user: AppUser;
}

export type WorkerProfileUpdate = {
  profession?: string;
  description?: string | null;
  experience_years?: number | null;
  price?: number | null;
  specializations?: string[] | string | null;
  city?: string | null;
};

function mapWorkerProfileError(error?: string): string {
  switch (error) {
    case "Worker access required.":
      return "Accesul este disponibil doar pentru conturi de meseriaș.";
    case "Profession is required.":
    case "Profession cannot be empty.":
      return "Meseria / titlul profesional este obligatoriu.";
    case "Invalid price.":
      return "Tariful introdus nu este valid.";
    case "Invalid experience years.":
      return "Anii de experiență nu sunt valizi.";
    case "Invalid city.":
      return "Oraș invalid.";
    case "Cannot remove specializations verified by domain studies.":
      return "Nu poți elimina specializările asociate studiilor verificate în domeniu.";
    case "Worker profile not found. Complete your public profile first.":
      return "Completează mai întâi meseria în profilul public.";
    case "File type not allowed. Use JPG, PNG or WebP.":
      return "Format neacceptat. Folosește JPG, PNG sau WebP.";
    case "No file provided.":
      return "Selectează o imagine.";
    default:
      return error || "Eroare la salvarea profilului.";
  }
}

export function parseSpecializations(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function fetchMyWorkerProfile(): Promise<{
  success: boolean;
  data?: MyWorkerProfileResponse;
  error?: string;
}> {
  const { data, error } = await apiFetch<MyWorkerProfileResponse>("/api/workers/me");
  if (!data) {
    return { success: false, error: mapWorkerProfileError(error) };
  }
  return { success: true, data };
}

export async function upsertMyWorkerProfile(
  payload: WorkerProfileUpdate
): Promise<{
  success: boolean;
  data?: { worker: WorkerProfile; user: AppUser; message?: string };
  error?: string;
}> {
  const { data, error } = await apiFetch<{
    worker: WorkerProfile;
    user: AppUser;
    message?: string;
  }>("/api/workers/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!data?.worker) {
    return { success: false, error: mapWorkerProfileError(error) };
  }

  return { success: true, data };
}

export async function uploadWorkerCoverImage(
  file: File
): Promise<{
  success: boolean;
  data?: { worker: WorkerProfile; user: AppUser };
  error?: string;
}> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: "Nu ești autentificat." };
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${getApiUrl()}/api/workers/me/cover-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = (await res.json().catch(() => ({}))) as {
      worker?: WorkerProfile;
      user?: AppUser;
      error?: string;
    };
    if (!res.ok || !body.worker) {
      return { success: false, error: mapWorkerProfileError(body.error) };
    }
    return { success: true, data: { worker: body.worker, user: body.user! } };
  } catch {
    return { success: false, error: "Eroare de rețea." };
  }
}

export interface SecurityActivityItem {
  id: string;
  type: string;
  details: string;
  ip: string | null;
  date: string;
  icon: "check" | "info";
}

export async function getSecurityActivity(options?: {
  limit?: number;
  days?: number;
}): Promise<{ activities: SecurityActivityItem[]; error?: string }> {
  const limit = options?.limit ?? 30;
  const days = Math.min(Math.max(options?.days ?? 30, 1), 90);
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    days: String(days),
  });

  const { data, error } = await apiFetch<{ activities?: SecurityActivityItem[] }>(
    `/api/users/me/security-activity?${params}`,
    { method: "GET", cache: "no-store" }
  );

  if (!data) {
    return { activities: [], error: error || "Eroare la încărcare." };
  }

  return { activities: data.activities ?? [] };
}

export interface Announcement {
  id: string;
  title: string;
  status: string;
  category: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export type AdminAnnouncement = Announcement;

export async function getAnnouncements(): Promise<{
  announcements: Announcement[];
  error?: string;
}> {
  const { data, error } = await apiFetch<{ announcements?: Announcement[] }>(
    "/api/announcements",
    { method: "GET", cache: "no-store" }
  );

  if (!data) {
    return { announcements: [], error: error || "Eroare la încărcarea anunțurilor." };
  }

  return { announcements: data.announcements ?? [] };
}

export async function getAdminAnnouncements(): Promise<{
  announcements: Announcement[];
  error?: string;
}> {
  const { data, error } = await apiFetch<{ announcements?: Announcement[] }>(
    "/api/admin/announcements",
    { method: "GET", cache: "no-store" }
  );

  if (!data) {
    return { announcements: [], error: error || "Eroare la încărcarea anunțurilor." };
  }

  return { announcements: data.announcements ?? [] };
}

export async function createAdminAnnouncement(body: {
  title: string;
  status?: string;
  category?: string;
  content?: string;
}): Promise<{ id?: string; success: boolean; error?: string }> {
  const { data, error, status } = await apiFetch<{ id?: string }>(
    "/api/admin/announcements",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  if (!data || status >= 400) {
    return { success: false, error: error || "Eroare la crearea anunțului." };
  }

  return { success: true, id: data.id };
}

export async function updateAdminAnnouncement(
  id: string,
  body: { title?: string; status?: string; category?: string; content?: string }
): Promise<{ success: boolean; error?: string }> {
  const { error, status } = await apiFetch(
    `/api/admin/announcements/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );

  if (status >= 400) {
    return { success: false, error: error || "Eroare la actualizarea anunțului." };
  }

  return { success: true };
}

export async function deleteAdminAnnouncement(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error, status } = await apiFetch(
    `/api/admin/announcements/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  if (status >= 400) {
    return { success: false, error: error || "Eroare la ștergerea anunțului." };
  }

  return { success: true };
}

export interface WorkerReviewItem {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  projectTitle: string;
  createdAt: string;
  response: string | null;
  responseAt: string | null;
  hasResponse: boolean;
}

export interface MyReviewsResponse {
  reviews: WorkerReviewItem[];
  summary: {
    average_rating: number;
    total: number;
  };
  worker_only?: boolean;
}

export type ReviewAnsweredFilter = "all" | "yes" | "no";
export type ReviewSortOption = "newest" | "oldest" | "rating-desc" | "rating-asc";

export async function getMyReceivedReviews(options?: {
  rating?: number;
  answered?: ReviewAnsweredFilter;
  sort?: ReviewSortOption;
}): Promise<{ data: MyReviewsResponse | null; error?: string }> {
  const params = new URLSearchParams();
  if (options?.rating) params.set("rating", String(options.rating));
  if (options?.answered && options.answered !== "all") {
    params.set("answered", options.answered);
  }
  if (options?.sort) params.set("sort", options.sort);

  const query = params.toString();
  const { data, error } = await apiFetch<MyReviewsResponse>(
    `/api/reviews/me${query ? `?${query}` : ""}`,
    { method: "GET", cache: "no-store" }
  );

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea recenziilor." };
  }

  return { data };
}

export async function replyToReview(
  reviewId: string,
  response: string
): Promise<{ success: boolean; review?: WorkerReviewItem; error?: string }> {
  const { data, error, status } = await apiFetch<{ review?: WorkerReviewItem }>(
    `/api/reviews/${encodeURIComponent(reviewId)}/response`,
    {
      method: "PATCH",
      body: JSON.stringify({ response }),
    }
  );

  if (!data?.review || status >= 400) {
    return { success: false, error: error || "Nu am putut trimite răspunsul." };
  }

  return { success: true, review: data.review };
}

export type OfferStatus = "pending" | "accepted" | "rejected";

export interface MyJobItem {
  id: number;
  client_user_id: number;
  worker_id: number | null;
  title: string;
  description: string;
  category: string;
  city: string;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
  cover_image: string | null;
  gallery_images: string[];
  created_at: string;
  updated_at: string;
  has_review?: boolean;
}

export async function getMyJobs(): Promise<{
  data: MyJobItem[] | null;
  error?: string;
}> {
  const { data, error } = await apiFetch<MyJobItem[]>("/api/jobs/my", {
    method: "GET",
    cache: "no-store",
  });

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea proiectelor." };
  }

  return { data };
}

export interface ApiJobSummary {
  id: number;
  title: string;
  category: string;
  city: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
}

export interface MyOfferItem {
  id: number;
  job_id: number;
  worker_id: number;
  price: number | null;
  message: string | null;
  estimated_days: number | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  job: ApiJobSummary | null;
}

export async function getMyOffers(): Promise<{
  data: MyOfferItem[] | null;
  error?: string;
}> {
  const { data, error } = await apiFetch<MyOfferItem[]>("/api/offers/my", {
    method: "GET",
    cache: "no-store",
  });

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea ofertelor." };
  }

  return { data };
}

export type JobSearchParams = {
  keyword?: string;
  category?: string;
  city?: string;
  status?: string;
};

export async function searchJobs(
  params: JobSearchParams = {}
): Promise<{ data: MyJobItem[] | null; error?: string }> {
  const qs = new URLSearchParams();
  if (params.keyword?.trim()) qs.set("keyword", params.keyword.trim());
  if (params.category?.trim()) qs.set("category", params.category.trim());
  if (params.city?.trim()) qs.set("city", params.city.trim());
  if (params.status?.trim()) qs.set("status", params.status.trim());

  const query = qs.toString();
  const { data, error } = await apiFetch<MyJobItem[]>(
    `/api/jobs/search${query ? `?${query}` : ""}`,
    { method: "GET", cache: "no-store" }
  );

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea proiectelor." };
  }

  return { data };
}

export async function listJobs(): Promise<{
  data: MyJobItem[] | null;
  error?: string;
}> {
  const { data, error } = await apiFetch<MyJobItem[]>("/api/jobs", {
    method: "GET",
    cache: "no-store",
  });

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea proiectelor." };
  }

  return { data };
}

export async function getJob(jobId: number): Promise<{
  data: MyJobItem | null;
  error?: string;
}> {
  const { data, error, status } = await apiFetch<MyJobItem>(`/api/jobs/${jobId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (status === 404) {
    return { data: null, error: "Proiectul nu a fost găsit." };
  }

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea proiectului." };
  }

  return { data };
}

export type CreateJobPayload = {
  title: string;
  description: string;
  category: string;
  city: string;
  budget_min?: number | null;
  budget_max?: number | null;
  scheduled_at?: string | null;
};

export async function createJob(
  payload: CreateJobPayload
): Promise<{ success: boolean; job_id?: number; error?: string }> {
  const { data, error, status } = await apiFetch<{ job_id?: number }>("/api/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.job_id || status >= 400) {
    return { success: false, error: error || "Nu am putut publica proiectul." };
  }

  return { success: true, job_id: data.job_id };
}

export function getJobImageUrl(filename: string | null | undefined): string | null {
  return getProfilePictureUrl(filename ?? null);
}

export async function uploadJobCoverImage(
  jobId: number,
  file: File
): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken();
  if (!token) return { success: false, error: "Nu ești autentificat." };

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${getApiUrl()}/api/jobs/${jobId}/cover-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { success: false, error: body.error || "Încărcarea imaginii a eșuat." };
    return { success: true };
  } catch {
    return { success: false, error: "Eroare de rețea." };
  }
}

export async function uploadJobGalleryImages(
  jobId: number,
  files: File[]
): Promise<{ success: boolean; error?: string }> {
  if (files.length === 0) return { success: true };

  const token = getAuthToken();
  if (!token) return { success: false, error: "Nu ești autentificat." };

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  try {
    const res = await fetch(`${getApiUrl()}/api/jobs/${jobId}/gallery`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { success: false, error: body.error || "Încărcarea galeriei a eșuat." };
    return { success: true };
  } catch {
    return { success: false, error: "Eroare de rețea." };
  }
}

export interface ApiOfferItem {
  id: number;
  job_id: number;
  worker_id: number;
  price: number | null;
  message: string | null;
  estimated_days: number | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

export async function getJobOffers(jobId: number): Promise<{
  data: ApiOfferItem[] | null;
  error?: string;
}> {
  const { data, error } = await apiFetch<ApiOfferItem[]>(`/api/offers/job/${jobId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea ofertelor." };
  }

  return { data };
}

export type CreateOfferPayload = {
  job_id: number;
  price: number;
  message?: string;
  estimated_days?: number | null;
};

export async function createOffer(
  payload: CreateOfferPayload
): Promise<{ success: boolean; offer_id?: number; error?: string }> {
  const { data, error, status } = await apiFetch<{ offer_id?: number }>("/api/offers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.offer_id || status >= 400) {
    return { success: false, error: error || "Nu am putut trimite oferta." };
  }

  return { success: true, offer_id: data.offer_id };
}

export async function listWorkers(): Promise<{
  data: WorkerProfile[] | null;
  error?: string;
}> {
  const { data, error } = await apiFetch<WorkerProfile[]>("/api/workers", {
    method: "GET",
    cache: "no-store",
  });

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea meseriașilor." };
  }

  return { data };
}

export async function listCompanies(): Promise<{
  data: PublicCompanyProfile[] | null;
  error?: string;
}> {
  const { data, error } = await apiFetch<PublicCompanyProfile[]>("/api/companies", {
    method: "GET",
    cache: "no-store",
  });

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea firmelor." };
  }

  return { data };
}

export async function getCompanyById(companyUserId: number): Promise<{
  data: PublicCompanyProfile | null;
  error?: string;
}> {
  const { data, error, status } = await apiFetch<PublicCompanyProfile>(
    `/api/companies/${companyUserId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (status === 404) {
    return { data: null, error: "Firma nu a fost găsită." };
  }

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea profilului firmei." };
  }

  return { data };
}

export async function getWorkerById(workerId: number): Promise<{
  data: WorkerProfile | null;
  error?: string;
}> {
  const { data, error, status } = await apiFetch<WorkerProfile>(
    `/api/workers/${workerId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (status === 404) {
    return { data: null, error: "Meseriașul nu a fost găsit." };
  }

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea profilului." };
  }

  return { data };
}

export interface ApiWorkerReview {
  id: number;
  job_id: number;
  client_user_id: number;
  worker_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export async function getWorkerReviews(workerId: number): Promise<{
  data: ApiWorkerReview[] | null;
  error?: string;
}> {
  const { data, error } = await apiFetch<ApiWorkerReview[]>(
    `/api/reviews/worker/${workerId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea recenziilor." };
  }

  return { data };
}

export interface WorkerJobItem {
  id: number;
  client_user_id: number;
  worker_id: number | null;
  title: string;
  description: string;
  category: string;
  city: string;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getWorkerMyJobs(): Promise<{
  data: WorkerJobItem[] | null;
  error?: string;
}> {
  const { data, error, status } = await apiFetch<WorkerJobItem[] | { error?: string }>(
    "/api/workers/my-jobs",
    { method: "GET", cache: "no-store" }
  );

  if (status === 404) {
    return { data: [] };
  }

  if (!data || Array.isArray(data) === false) {
    const errBody = data as { error?: string } | null;
    return {
      data: null,
      error: errBody?.error || error || "Eroare la încărcarea calendarului.",
    };
  }

  return { data };
}

export type ApiCalendarEventType = "site_visit" | "work" | "meeting" | "deadline" | "maintenance";

export interface ApiCalendarEventItem {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  materials: string | null;
  event_type: ApiCalendarEventType;
  location: string | null;
  starts_at: string;
  ends_at: string;
  job_id: number | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarEventPayload = {
  title: string;
  description?: string | null;
  materials?: string | null;
  event_type: ApiCalendarEventType;
  location?: string | null;
  starts_at: string;
  ends_at: string;
  job_id?: number | null;
  project_id?: string | null;
};

export async function getCalendarEvents(
  from: string,
  to: string
): Promise<{ data: { events: ApiCalendarEventItem[] } | null; error?: string }> {
  const params = new URLSearchParams({ from, to });
  const { data, error } = await apiFetch<{ events: ApiCalendarEventItem[] }>(
    `/api/calendar/events?${params.toString()}`,
    { method: "GET", cache: "no-store" }
  );
  if (!data) {
    return { data: null, error: error || "Eroare la încărcarea evenimentelor." };
  }
  return { data };
}

export async function createCalendarEvent(
  payload: CalendarEventPayload
): Promise<{ event: ApiCalendarEventItem | null; error?: string }> {
  const { data, error, status } = await apiFetch<{ event?: ApiCalendarEventItem }>(
    "/api/calendar/events",
    { method: "POST", body: JSON.stringify(payload) }
  );
  if (!data?.event || status >= 400) {
    return { event: null, error: error || "Nu am putut salva evenimentul." };
  }
  return { event: data.event };
}

export async function updateCalendarEvent(
  eventId: number,
  payload: Partial<CalendarEventPayload>
): Promise<{ event: ApiCalendarEventItem | null; error?: string }> {
  const { data, error, status } = await apiFetch<{ event?: ApiCalendarEventItem }>(
    `/api/calendar/events/${eventId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  if (!data?.event || status >= 400) {
    return { event: null, error: error || "Nu am putut actualiza evenimentul." };
  }
  return { event: data.event };
}

export async function deleteCalendarEvent(
  eventId: number
): Promise<{ success: boolean; error?: string }> {
  const { error, status } = await apiFetch<{ message?: string }>(
    `/api/calendar/events/${eventId}`,
    { method: "DELETE" }
  );
  if (status >= 400) {
    return { success: false, error: error || "Nu am putut șterge evenimentul." };
  }
  return { success: true };
}

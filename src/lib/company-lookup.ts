import type { CompanyVerificationPayload } from "@/lib/api-client";

export type CompanyAdministrator = {
  name: string;
  role: string;
  personId?: number;
};

export type CompanyLookupData = {
  cui: number | string;
  name: string;
  address: string;
  legalForm: string;
  registrationNumber: string;
  registrationState?: string;
  onrcStatusLabel?: string;
  inactive?: boolean;
  caenCode?: string;
  authorizedCaenCodes?: string[];
  administrators?: CompanyAdministrator[];
  headquartersAddress?: {
    street?: string;
    number?: string;
    locality?: string;
    county?: string;
    country?: string;
    postalCode?: string;
  };
};

export type CompanyLookupResponse = {
  success: boolean;
  data: CompanyLookupData;
  meta?: { cached?: boolean; source?: string };
};

const LEGAL_FORMS = new Set(["SRL", "SA", "II", "IF"]);

function formatHeadquartersAddress(data: CompanyLookupData): string {
  if (data.address?.trim()) return data.address.trim();
  const hq = data.headquartersAddress;
  if (!hq) return "";
  const parts = [
    [hq.street, hq.number].filter(Boolean).join(" "),
    hq.locality,
    hq.county,
    hq.country,
  ].filter(Boolean);
  return parts.join(", ");
}

export function mapCompanyLookupToForm(data: CompanyLookupData): CompanyVerificationPayload {
  const legalForm = (data.legalForm || "").trim().toUpperCase();
  return {
    company_name: data.name?.trim() || "",
    company_cui: String(data.cui || "").replace(/^RO/i, ""),
    company_reg_com: data.registrationNumber?.trim() || "",
    company_legal_form: LEGAL_FORMS.has(legalForm) ? legalForm : legalForm || "SRL",
    company_address: formatHeadquartersAddress(data),
  };
}

function normalizeNamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(...parts: string[]): string[] {
  return parts
    .flatMap((part) => normalizeNamePart(part).split(" "))
    .filter((token) => token.length > 1);
}

export function matchesCompanyAdministrator(
  firstName: string,
  lastName: string,
  administrators: CompanyAdministrator[] = []
): boolean {
  const lastTokens = nameTokens(lastName);
  const firstTokens = nameTokens(firstName);
  if (lastTokens.length === 0 || administrators.length === 0) return false;

  return administrators.some((admin) => {
    const adminTokenSet = new Set(nameTokens(admin.name));
    const hasLast = lastTokens.some((token) => adminTokenSet.has(token));
    const hasFirst =
      firstTokens.length === 0 || firstTokens.some((token) => adminTokenSet.has(token));
    return hasLast && hasFirst;
  });
}

export function mapCompanyLookupError(error?: string): string {
  switch (error) {
    case "Invalid CUI.":
      return "CUI invalid. Introdu între 1 și 10 cifre.";
    case "Company not found.":
      return "Nu am găsit firma pentru acest CUI.";
    case "Company lookup unavailable.":
      return "Serviciul de preluare date nu este disponibil momentan.";
    case "Company lookup failed.":
      return "Preluarea datelor firmei a eșuat. Încearcă din nou.";
    default:
      return error || "Nu am putut prelua datele firmei.";
  }
}

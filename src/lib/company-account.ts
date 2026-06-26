import type { AppUser } from "@/lib/api-client";
import type { SsoProfile } from "@/lib/auth-client";

export type CompanyStatus =
    | "onboarding"
    | "pending_review"
    | "rejected"
    | "pending_payment"
    | "active";

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
    onboarding: "Date firmă de completat",
    pending_review: "În verificare de către administrator",
    rejected: "Respins — corectează și retrimite",
    pending_payment: "Aprobare primită — activează abonamentul",
    active: "Cont activ",
};

type CompanyUserLike = Pick<
    AppUser,
    | "is_company_account"
    | "registration_type"
    | "is_company_active"
    | "company_status"
    | "company_name"
> &
    Pick<
        SsoProfile,
        | "is_company_account"
        | "registration_type"
        | "is_company_active"
        | "company_status"
        | "company_name"
    >;

export function getNavbarQualityLabel(
    user: (CompanyUserLike & { role?: string | null }) | null | undefined
): string {
    if (!user) return "";
    if (isCompanyAccount(user)) {
        return user.company_name?.trim() || "Companie";
    }
    if (user.role === "client") return "Client";
    return "Meseriaș";
}

export function isCompanyAccount(user: CompanyUserLike | null | undefined): boolean {
    return Boolean(user?.is_company_account || user?.registration_type === "company");
}

export function isCompanyAccountActive(user: CompanyUserLike | null | undefined): boolean {
    return Boolean(user?.is_company_active || user?.company_status === "active");
}

export function needsCompanyOnboarding(user: CompanyUserLike | null | undefined): boolean {
    if (!isCompanyAccount(user)) return false;
    return !isCompanyAccountActive(user);
}

export function getCompanyOnboardingPath(): string {
    return "/onboarding/firma";
}

import { HERO_CATEGORIES } from "@/data/heroCategories";
import {
  getProfilePictureUrl,
  parseSpecializations,
  type ApiWorkerReview,
  type CompanyTeamMember,
  type MyJobItem,
  type PublicCompanyProfile,
  type WorkerProfile,
} from "@/lib/api-client";
import type { Meserias } from "@/types/meserias";
import type { FirmaTeamMember, MeseriasReview } from "@/types/meseriasProfile";
import type { Project, ProjectClient } from "@/types/project";

export const COMPANY_SLUG_PREFIX = "c-";

export function companySlug(companyUserId: number): string {
  return `${COMPANY_SLUG_PREFIX}${companyUserId}`;
}

export function parseCompanySlug(slug: string): number | null {
  if (!slug.startsWith(COMPANY_SLUG_PREFIX)) return null;
  const id = Number(slug.slice(COMPANY_SLUG_PREFIX.length));
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function isCompanySlug(slug: string): boolean {
  return parseCompanySlug(slug) !== null;
}

const JOB_STATUS_LABELS: Record<string, string> = {
  open: "Caut meseriași",
  assigned: "Atribuit",
  in_progress: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
};

function resolveCategorySlug(category: string): string {
  const normalized = category.trim().toLowerCase();
  const match = HERO_CATEGORIES.find(
    (cat) =>
      cat.slug === normalized ||
      cat.label.toLowerCase() === normalized ||
      cat.label.toLowerCase().includes(normalized) ||
      normalized.includes(cat.label.toLowerCase())
  );
  return match?.slug ?? normalized.replace(/\s+/g, "-");
}

export function formatApiJobBudget(
  budgetMin: number | null,
  budgetMax: number | null
): string | undefined {
  if (budgetMin == null && budgetMax == null) return undefined;
  if (budgetMin != null && budgetMax != null) {
    return `${budgetMin.toLocaleString("ro-RO")} – ${budgetMax.toLocaleString("ro-RO")} RON`;
  }
  const value = budgetMin ?? budgetMax;
  return value != null ? `${value.toLocaleString("ro-RO")} RON` : undefined;
}

function placeholderClient(clientUserId: number, city: string): ProjectClient {
  return {
    id: String(clientUserId),
    name: "Client",
    type: "persoana-fizica",
    avatar: "",
    location: city,
    memberSince: new Date().toISOString(),
    projectsPublished: 0,
    verified: false,
    rating: 0,
    reviewCount: 0,
    phone: "",
    email: "",
  };
}

export function apiJobToProject(
  job: Pick<
    MyJobItem,
    | "id"
    | "client_user_id"
    | "title"
    | "description"
    | "category"
    | "city"
    | "budget_min"
    | "budget_max"
    | "status"
    | "created_at"
    | "cover_image"
  >,
  options?: { offerCount?: number; clientName?: string }
): Project {
  const publishedDate = new Date(job.created_at).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const client = placeholderClient(job.client_user_id, job.city);
  if (options?.clientName) {
    client.name = options.clientName;
  }

  return {
    id: String(job.id),
    title: job.title,
    category: job.category,
    categorySlug: resolveCategorySlug(job.category),
    subcategories: [],
    status: JOB_STATUS_LABELS[job.status] ?? job.status,
    date: publishedDate,
    image: job.cover_image ? getProfilePictureUrl(job.cover_image) ?? "" : "",
    location: job.city,
    county: job.city,
    excerpt:
      job.description.length > 180
        ? `${job.description.slice(0, 177)}...`
        : job.description,
    trades: [job.category],
    budget: formatApiJobBudget(job.budget_min, job.budget_max),
    budgetMin: job.budget_min ?? undefined,
    budgetMax: job.budget_max ?? undefined,
    publishedAt: job.created_at,
    applicants: options?.offerCount,
    client,
  };
}

export function workerProfileToMeserias(worker: WorkerProfile): Meserias {
  const legalName =
    `${worker.first_name ?? ""} ${worker.last_name ?? ""}`.trim() ||
    `Meseriaș #${worker.id}`;
  const name = worker.display_name?.trim() || legalName;
  const specializations = parseSpecializations(worker.specializations);
  const city = worker.city?.trim() || "România";
  const avatar = worker.profile_picture
    ? getProfilePictureUrl(worker.profile_picture) ?? ""
    : "";

  return {
    id: String(worker.id),
    slug: String(worker.id),
    name,
    type: "individual",
    tagline: worker.profession || "Meseriaș",
    description: worker.description?.trim() || "Profil meseriaș pe AiMeseriaș.",
    location: city,
    city,
    county: city,
    categories: specializations.length > 0 ? specializations : [worker.profession].filter(Boolean),
    trades: specializations.length > 0 ? specializations : [worker.profession].filter(Boolean),
    rating: worker.average_rating ?? 0,
    reviewCount: worker.total_reviews ?? 0,
    completedProjects: worker.completed_jobs ?? 0,
    verified: Boolean(worker.verified),
    image: avatar,
    memberSince: worker.created_at,
    phone: worker.phone ?? "",
    email: worker.email ?? "",
    hasPfa: Boolean(worker.has_pfa),
  };
}

function companyTeamMemberToFirmaMember(member: CompanyTeamMember): FirmaTeamMember {
  const avatar = member.profile_picture
    ? getProfilePictureUrl(member.profile_picture) ?? ""
    : "";

  return {
    id: String(member.worker_id),
    name: member.name,
    role: member.profession,
    image: avatar,
    rating: member.average_rating ?? 0,
    reviewCount: member.total_reviews ?? 0,
    portfolio: [],
    reviews: [],
  };
}

export function companyProfileToMeserias(company: PublicCompanyProfile): Meserias {
  const city = company.city?.trim() || "România";
  const avatar = company.profile_picture
    ? getProfilePictureUrl(company.profile_picture) ?? ""
    : "";

  return {
    id: `company-${company.id}`,
    slug: companySlug(company.id),
    name: company.company_name,
    type: "firma",
    tagline: company.profession || `${company.worker_count} meseriași în echipă`,
    description:
      company.description?.trim() ||
      `Firmă de construcții și servicii cu ${company.worker_count} meseriași asociați.`,
    location: company.company_address?.trim() || city,
    city,
    county: city,
    categories: company.profession ? [company.profession] : [],
    trades: company.profession ? [company.profession] : [],
    rating: company.average_rating ?? 0,
    reviewCount: company.total_reviews ?? 0,
    completedProjects: company.completed_jobs ?? 0,
    verified: Boolean(company.is_company_active),
    image: avatar,
    teamSize: company.worker_count,
    memberSince: company.created_at ?? new Date().toISOString(),
    phone: company.phone ?? "",
    email: company.email ?? "",
    companyUserId: company.id,
    companyCui: company.company_cui,
    companyRegCom: company.company_reg_com,
    companyLegalForm: company.company_legal_form,
    companyAddress: company.company_address,
  };
}

export function companyMembersToFirmaTeam(
  members: CompanyTeamMember[] | undefined
): FirmaTeamMember[] {
  return (members ?? []).map(companyTeamMemberToFirmaMember);
}

export function apiReviewToMeseriasReview(review: ApiWorkerReview): MeseriasReview {
  return {
    id: String(review.id),
    author: "Client",
    rating: review.rating,
    date: new Date(review.created_at).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    text: review.comment?.trim() || "Fără comentariu.",
  };
}

export function getWorkerCoverImageUrl(coverImage: string | null): string | undefined {
  if (!coverImage?.trim()) return undefined;
  return getProfilePictureUrl(coverImage) ?? undefined;
}

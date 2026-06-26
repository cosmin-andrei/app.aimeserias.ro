import data from "@/data/projects.json";
import { CLIENT_RATING_FILTERS } from "@/data/projectFilters";
import { HERO_CATEGORIES } from "@/data/heroCategories";
import type { ClientType, Project } from "@/types/project";

export const PROJECTS: Project[] = data.projects as Project[];

export type ProjectFiltersState = {
    status: string;
    categorySlug: string;
    subcategories: string[];
    county: string;
    budgetMin: string;
    budgetMax: string;
    clientType: string;
    clientRatingMin: string;
};

export const DEFAULT_PROJECT_FILTERS: ProjectFiltersState = {
    status: "toate",
    categorySlug: "toate",
    subcategories: [],
    county: "toate",
    budgetMin: "",
    budgetMax: "",
    clientType: "toate",
    clientRatingMin: "toate",
};

export function getAllProjectsSorted(): Project[] {
    return sortProjects([...PROJECTS], "newest");
}

export type ProjectSortOption = "newest" | "budget-asc" | "budget-desc";

export const PROJECT_SORT_OPTIONS: { value: ProjectSortOption; label: string }[] = [
    { value: "newest", label: "Cele mai noi" },
    { value: "budget-asc", label: "Buget crescător" },
    { value: "budget-desc", label: "Buget descrescător" },
];

export function sortProjects(projects: Project[], sortBy: ProjectSortOption): Project[] {
    const sorted = [...projects];
    switch (sortBy) {
        case "budget-asc":
            return sorted.sort((a, b) => (a.budgetMin ?? 0) - (b.budgetMin ?? 0));
        case "budget-desc":
            return sorted.sort((a, b) => (b.budgetMax ?? 0) - (a.budgetMax ?? 0));
        default:
            return sorted.sort(
                (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );
    }
}

export function getProjectById(id: string): Project | undefined {
    return PROJECTS.find((p) => p.id === id);
}

export function getClientTypeLabel(type: ClientType): string {
    return type === "companie" ? "Companie" : "Persoană fizică";
}

export function getCategoryLabel(slug: string): string {
    return HERO_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function getUniqueProjectCounties(projects: Project[] = PROJECTS): string[] {
    return [...new Set(projects.map((p) => p.county))].sort((a, b) => a.localeCompare(b, "ro"));
}

type UserAddressLike = {
    addressType?: string | null;
    city?: string | null;
    county?: string | null;
};

type UserLocationLike = {
    city?: string | null;
    addresses?: UserAddressLike[] | null;
};

function normalizeLocationName(value: string): string {
    return value.trim().toLocaleLowerCase("ro");
}

function matchCatalogCounty(catalogCounties: string[], candidate: string): string | null {
    const norm = normalizeLocationName(candidate);
    const exact = catalogCounties.find((county) => normalizeLocationName(county) === norm);
    if (exact) return exact;

    const partial = catalogCounties.find(
        (county) =>
            normalizeLocationName(county).includes(norm) || norm.includes(normalizeLocationName(county))
    );
    return partial ?? null;
}

/** Județ preselectat pentru meseriași: domiciliu → reședință (oraș/județ din profil) */
export function resolveDefaultProjectCountyFilter(
    projects: Project[],
    user: UserLocationLike | null | undefined
): string {
    if (!user) return "toate";

    const addresses = user.addresses ?? [];
    const domiciliu = addresses.find((a) => a.addressType === "domiciliu");
    const resedinta = addresses.find(
        (a) => a.addressType === "resedinta" || a.addressType === "postala"
    );

    const catalogCounties = getUniqueProjectCounties(projects);
    const candidates: string[] = [];

    for (const addr of [domiciliu, resedinta]) {
        if (addr?.county?.trim()) candidates.push(addr.county.trim());
    }
    for (const addr of [domiciliu, resedinta]) {
        if (addr?.city?.trim()) candidates.push(addr.city.trim());
    }
    if (user.city?.trim()) candidates.push(user.city.trim());

    for (const candidate of candidates) {
        const matched = matchCatalogCounty(catalogCounties, candidate);
        if (matched) return matched;
    }

    return "toate";
}

export function getProjectBudgetBounds(): { min: number; max: number; step: number } {
    const maxs = PROJECTS.map((p) => p.budgetMax ?? p.budgetMin ?? 0);
    const dataMax = maxs.length ? Math.max(...maxs) : 100_000;
    const max = Math.max(50_000, Math.ceil(dataMax / 5_000) * 5_000);

    return { min: 0, max, step: 500 };
}

export function formatBudgetAmount(value: number): string {
    return value.toLocaleString("ro-RO");
}

export function getClientRatingBucket(rating: number): number {
    if (rating >= 4.5) return 5;
    if (rating >= 4) return 4;
    if (rating >= 3) return 3;
    if (rating >= 2) return 2;
    if (rating >= 1) return 1;
    return 0;
}

export function matchesClientRatingFilter(rating: number, filterValue: string): boolean {
    if (filterValue === "toate") return true;
    const option = CLIENT_RATING_FILTERS.find((item) => item.value === filterValue);
    if (!option) return true;
    return rating >= option.min && rating < option.max;
}

export function getClientRatingFilterLabel(filterValue: string): string {
    return CLIENT_RATING_FILTERS.find((item) => item.value === filterValue)?.label ?? filterValue;
}

export function filterProjects(projects: Project[], filters: ProjectFiltersState): Project[] {
    const bounds = getProjectBudgetBounds();
    const filterBudgetMin = filters.budgetMin.trim() !== "" ? Number(filters.budgetMin) : null;
    const filterBudgetMax = filters.budgetMax.trim() !== "" ? Number(filters.budgetMax) : null;

    return projects.filter((project) => {
        if (filters.status !== "toate" && project.status !== filters.status) return false;
        if (filters.categorySlug !== "toate" && project.categorySlug !== filters.categorySlug) return false;
        if (
            filters.subcategories.length > 0 &&
            !filters.subcategories.some(
                (sub) => project.subcategories.includes(sub) || project.trades.includes(sub)
            )
        ) {
            return false;
        }
        if (filters.county !== "toate" && project.county !== filters.county) return false;
        if (filters.clientType !== "toate" && project.client.type !== filters.clientType) return false;

        if (
            filters.clientRatingMin !== "toate" &&
            !matchesClientRatingFilter(project.client.rating, filters.clientRatingMin)
        ) {
            return false;
        }

        if (filterBudgetMin != null || filterBudgetMax != null) {
            const userMin = filterBudgetMin ?? bounds.min;
            const userMax = filterBudgetMax ?? bounds.max;
            const isFullRange = userMin <= bounds.min && userMax >= bounds.max;

            if (!isFullRange) {
                const projectMin = project.budgetMin ?? 0;
                const projectMax = project.budgetMax ?? projectMin;
                const overlaps = projectMax >= userMin && projectMin <= userMax;
                if (!overlaps) return false;
            }
        }

        return true;
    });
}

export function isBudgetFilterActive(filters: ProjectFiltersState): boolean {
    if (filters.budgetMin.trim() === "" && filters.budgetMax.trim() === "") return false;

    const bounds = getProjectBudgetBounds();
    const userMin = filters.budgetMin.trim() !== "" ? Number(filters.budgetMin) : bounds.min;
    const userMax = filters.budgetMax.trim() !== "" ? Number(filters.budgetMax) : bounds.max;

    return !(userMin <= bounds.min && userMax >= bounds.max);
}

export function countActiveProjectFilters(filters: ProjectFiltersState): number {
    let count = Object.entries(filters).filter(([key, value]) => {
        if (key === "budgetMin" || key === "budgetMax" || key === "subcategories") return false;
        const defaultValue = DEFAULT_PROJECT_FILTERS[key as keyof ProjectFiltersState];
        return value !== defaultValue;
    }).length;

    count += filters.subcategories.length;
    if (isBudgetFilterActive(filters)) count += 1;

    return count;
}

type FilterCountField =
    | "status"
    | "categorySlug"
    | "subcategory"
    | "county"
    | "clientType"
    | "clientRatingMin";

export function countProjectsForFilterOption(
    projects: Project[],
    filters: ProjectFiltersState,
    field: FilterCountField,
    value: string
): number {
    const base: ProjectFiltersState = { ...filters };

    if (field === "categorySlug") {
        base.categorySlug = DEFAULT_PROJECT_FILTERS.categorySlug;
        base.subcategories = [];
    } else if (field === "subcategory") {
        base.subcategories = [];
    } else if (field === "clientRatingMin") {
        base.clientRatingMin = DEFAULT_PROJECT_FILTERS.clientRatingMin;
    } else {
        base[field] = DEFAULT_PROJECT_FILTERS[field] as never;
    }

    if (field === "subcategory") {
        return filterProjects(projects, { ...base, subcategories: [value] }).length;
    }

    return filterProjects(projects, { ...base, [field]: value }).length;
}

export type ActiveProjectFilter = {
    key: string;
    label: string;
};

export function getActiveProjectFilters(filters: ProjectFiltersState): ActiveProjectFilter[] {
    const active: ActiveProjectFilter[] = [];

    if (filters.status !== "toate") {
        active.push({ key: "status", label: filters.status });
    }
    if (filters.categorySlug !== "toate") {
        active.push({ key: "categorySlug", label: getCategoryLabel(filters.categorySlug) });
    }
    if (filters.subcategories.length > 0) {
        filters.subcategories.forEach((sub) => {
            active.push({ key: `subcategory:${sub}`, label: sub });
        });
    }
    if (filters.county !== "toate") {
        active.push({ key: "county", label: filters.county });
    }
    if (filters.clientType !== "toate") {
        active.push({
            key: "clientType",
            label: getClientTypeLabel(filters.clientType as ClientType),
        });
    }
    if (filters.clientRatingMin !== "toate") {
        active.push({
            key: "clientRatingMin",
            label: getClientRatingFilterLabel(filters.clientRatingMin),
        });
    }
    if (isBudgetFilterActive(filters)) {
        const bounds = getProjectBudgetBounds();
        const lo = filters.budgetMin.trim() !== "" ? Number(filters.budgetMin) : bounds.min;
        const hi = filters.budgetMax.trim() !== "" ? Number(filters.budgetMax) : bounds.max;
        active.push({
            key: "budget",
            label: `${formatBudgetAmount(lo)} – ${formatBudgetAmount(hi)} RON`,
        });
    }

    return active;
}

export function removeProjectFilter(
    filters: ProjectFiltersState,
    key: string
): ProjectFiltersState {
    switch (key) {
        case "status":
            return { ...filters, status: "toate" };
        case "categorySlug":
            return { ...filters, categorySlug: "toate", subcategories: [] };
        case "subcategory":
            return { ...filters, subcategories: [] };
        case "county":
            return { ...filters, county: "toate" };
        case "clientType":
            return { ...filters, clientType: "toate" };
        case "clientRatingMin":
            return { ...filters, clientRatingMin: "toate" };
        case "budget":
            return { ...filters, budgetMin: "", budgetMax: "" };
        default:
            if (key.startsWith("subcategory:")) {
                const sub = key.slice("subcategory:".length);
                return {
                    ...filters,
                    subcategories: filters.subcategories.filter((s) => s !== sub),
                };
            }
            return filters;
    }
}

export const STATUS_STYLES: Record<string, string> = {
    "Caut meseriași": "bg-amber-50 text-amber-800 ring-amber-200/70",
    "În desfășurare": "bg-[#0060f0]/10 text-[#0060f0] ring-[#0060f0]/20",
    Finalizat: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
};

/** Stiluri cu contrast ridicat pentru badge pe imagine (carduri, preview). */
export const STATUS_CARD_STYLES: Record<string, string> = {
    "Caut meseriași": "bg-amber-500 text-white ring-1 ring-white/40 shadow-sm",
    "În desfășurare": "bg-[#0060f0] text-white ring-1 ring-white/40 shadow-sm",
    Finalizat: "bg-emerald-600 text-white ring-1 ring-white/40 shadow-sm",
};

export const STATUS_DOT_COLORS: Record<string, string> = {
    "Caut meseriași": "bg-amber-400",
    "În desfășurare": "bg-[#0060f0]",
    Finalizat: "bg-emerald-500",
};

export function getStatusDotColor(status: string): string {
    return STATUS_DOT_COLORS[status] ?? "bg-gray-300";
}

export function getStatusStyle(status: string): string {
    return STATUS_STYLES[status] ?? "bg-[#002050]/8 text-[#002050] ring-[#002050]/15";
}

export function getStatusCardStyle(status: string): string {
    return STATUS_CARD_STYLES[status] ?? "bg-[#002050] text-white ring-1 ring-white/40 shadow-sm";
}

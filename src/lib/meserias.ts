import data from "@/data/meseriasi.json";
import { HERO_CATEGORIES } from "@/data/heroCategories";
import {
    getClientRatingFilterLabel,
    matchesClientRatingFilter,
} from "@/lib/project";
import type { Meserias, MeseriasType } from "@/types/meserias";

export const MESERIASI: Meserias[] = data.meseriasi as Meserias[];

export type MeseriasFilterType = "toate" | "individual" | "pfa" | "firma";

export type MeseriasFiltersState = {
    type: MeseriasFilterType;
    category: string;
    city: string;
    query: string;
    ratingMin: string;
    verified: string;
};

export const DEFAULT_MESERIAS_FILTERS: MeseriasFiltersState = {
    type: "toate",
    category: "toate",
    city: "toate",
    query: "",
    ratingMin: "toate",
    verified: "toate",
};

export type MeseriasSortOption = "default" | "newest" | "rating-desc" | "rating-asc" | "reviews-desc";

export const MESERIAS_SORT_OPTIONS: { value: MeseriasSortOption; label: string }[] = [
    { value: "default", label: "Sortare implicită" },
    { value: "newest", label: "Cele mai noi" },
    { value: "rating-desc", label: "Rating descrescător" },
    { value: "rating-asc", label: "Rating crescător" },
    { value: "reviews-desc", label: "Cele mai multe recenzii" },
];

export function getMeseriasBySlug(slug: string): Meserias | undefined {
    return MESERIASI.find((m) => m.slug === slug);
}

export function getCategoryLabel(slug: string): string {
    return HERO_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function getUniqueCounties(meseriasi: Meserias[] = MESERIASI): string[] {
    return [...new Set(meseriasi.map((m) => m.county))].sort((a, b) => a.localeCompare(b, "ro"));
}

export function getUniqueCities(meseriasi: Meserias[] = MESERIASI): string[] {
    return [...new Set(meseriasi.map((m) => m.city))].sort((a, b) => a.localeCompare(b, "ro"));
}

function normalizeCityName(value: string): string {
    return value.trim().toLocaleLowerCase("ro");
}

type UserAddressLike = {
    addressType?: string | null;
    city?: string | null;
};

type UserLocationLike = {
    city?: string | null;
    addresses?: UserAddressLike[] | null;
};

/** Oraș preselectat: reședință → domiciliu → toți meseriașii */
export function resolveDefaultMeseriasCityFilter(
    meseriasi: Meserias[],
    user: UserLocationLike | null | undefined
): string {
    if (!user) return "toate";

    const addresses = user.addresses ?? [];
    const resedinta = addresses.find(
        (a) => a.addressType === "resedinta" || a.addressType === "postala"
    );
    const domiciliu = addresses.find((a) => a.addressType === "domiciliu");

    const candidates = [resedinta?.city, domiciliu?.city, user.city]
        .map((city) => city?.trim())
        .filter(Boolean) as string[];

    const catalogCities = getUniqueCities(meseriasi);

    for (const candidate of candidates) {
        const norm = normalizeCityName(candidate);
        const exact = catalogCities.find((city) => normalizeCityName(city) === norm);
        if (exact) return exact;

        const partial = catalogCities.find(
            (city) =>
                normalizeCityName(city).includes(norm) || norm.includes(normalizeCityName(city))
        );
        if (partial) return partial;
    }

    return "toate";
}

export function getMeseriasTypeLabel(type: MeseriasType): string {
    return type === "firma" ? "Firmă" : "Meseriaș";
}

export const PFA_TYPE_LABEL = "Persoană fizică autorizată";

export function getMeseriasDisplayTypeLabel(meserias: Meserias): string {
    if (meserias.type === "firma") return "Firmă";
    if (meserias.hasPfa) return PFA_TYPE_LABEL;
    return "Meseriaș";
}

export function getMeseriasFilterTypeLabel(type: MeseriasFilterType): string {
    if (type === "toate") return "Toate";
    if (type === "pfa") return PFA_TYPE_LABEL;
    return getMeseriasTypeLabel(type);
}

function matchesMeseriasTypeFilter(meserias: Meserias, type: MeseriasFilterType): boolean {
    if (type === "toate") return true;
    if (type === "firma") return meserias.type === "firma";
    if (type === "pfa") return meserias.type === "individual" && meserias.hasPfa === true;
    return meserias.type === "individual" && !meserias.hasPfa;
}

export function sortMeseriasi(meseriasi: Meserias[], sortBy: MeseriasSortOption): Meserias[] {
    const sorted = [...meseriasi];
    switch (sortBy) {
        case "default":
            return sorted;
        case "rating-desc":
            return sorted.sort((a, b) => b.rating - a.rating);
        case "rating-asc":
            return sorted.sort((a, b) => a.rating - b.rating);
        case "reviews-desc":
            return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        default:
            return sorted.sort(
                (a, b) => new Date(b.memberSince).getTime() - new Date(a.memberSince).getTime()
            );
    }
}

export function filterMeseriasi(
    meseriasi: Meserias[],
    filters: MeseriasFiltersState
): Meserias[] {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return meseriasi.filter((m) => {
        if (!matchesMeseriasTypeFilter(m, filters.type)) return false;
        if (filters.category !== "toate" && !m.categories.includes(filters.category)) return false;
        if (filters.city !== "toate" && m.city !== filters.city) return false;
        if (filters.verified === "da" && !m.verified) return false;
        if (
            filters.ratingMin !== "toate" &&
            !matchesClientRatingFilter(m.rating, filters.ratingMin)
        ) {
            return false;
        }
        if (!normalizedQuery) return true;

        const haystack = [m.name, m.tagline, m.city, m.county, m.location, ...m.trades]
            .join(" ")
            .toLowerCase();

        return haystack.includes(normalizedQuery);
    });
}

type FilterCountField = "type" | "category" | "city" | "ratingMin" | "verified";

export function countMeseriasForFilterOption(
    meseriasi: Meserias[],
    filters: MeseriasFiltersState,
    field: FilterCountField,
    value: string
): number {
    const base: MeseriasFiltersState = { ...filters };
    base[field] = DEFAULT_MESERIAS_FILTERS[field] as never;
    return filterMeseriasi(meseriasi, { ...base, [field]: value }).length;
}

export function countActiveMeseriasFilters(filters: MeseriasFiltersState): number {
    let count = 0;
    if (filters.type !== "toate") count++;
    if (filters.category !== "toate") count++;
    if (filters.city !== "toate") count++;
    if (filters.ratingMin !== "toate") count++;
    if (filters.verified !== "toate") count++;
    if (filters.query.trim() !== "") count++;
    return count;
}

export type ActiveMeseriasFilter = {
    key: string;
    label: string;
};

export function getActiveMeseriasFilters(filters: MeseriasFiltersState): ActiveMeseriasFilter[] {
    const active: ActiveMeseriasFilter[] = [];

    if (filters.query.trim() !== "") {
        active.push({ key: "query", label: `"${filters.query.trim()}"` });
    }
    if (filters.type !== "toate") {
        active.push({
            key: "type",
            label: getMeseriasFilterTypeLabel(filters.type),
        });
    }
    if (filters.category !== "toate") {
        active.push({ key: "category", label: getCategoryLabel(filters.category) });
    }
    if (filters.city !== "toate") {
        active.push({ key: "city", label: filters.city });
    }
    if (filters.ratingMin !== "toate") {
        active.push({
            key: "ratingMin",
            label: getClientRatingFilterLabel(filters.ratingMin),
        });
    }
    if (filters.verified !== "toate") {
        active.push({ key: "verified", label: "Verificați" });
    }

    return active;
}

export function removeMeseriasFilter(
    filters: MeseriasFiltersState,
    key: string
): MeseriasFiltersState {
    switch (key) {
        case "type":
            return { ...filters, type: "toate" };
        case "category":
            return { ...filters, category: "toate" };
        case "city":
            return { ...filters, city: "toate" };
        case "ratingMin":
            return { ...filters, ratingMin: "toate" };
        case "verified":
            return { ...filters, verified: "toate" };
        case "query":
            return { ...filters, query: "" };
        default:
            return filters;
    }
}
"use client";

import { useMemo } from "react";
import { ClientRatingFilter } from "@/components/listing/ClientRatingFilter";
import { BudgetRangeFilter } from "@/components/listing/BudgetRangeFilter";
import { FilterCheckboxList } from "@/components/listing/FilterCheckboxList";
import { FilterCheckboxMultiList } from "@/components/listing/FilterCheckboxMultiList";
import { FilterSection } from "@/components/listing/FilterSection";
import { StatusSelect } from "@/components/listing/StatusSelect";
import { HERO_CATEGORIES } from "@/data/heroCategories";
import { PROJECT_STATUSES, PROJECT_SUBCATEGORIES } from "@/data/projectFilters";
import {
    countProjectsForFilterOption,
    getClientTypeLabel,
    type ProjectFiltersState,
} from "@/lib/project";
import type { Project } from "@/types/project";

type ProjectFiltersFormProps = {
    filters: ProjectFiltersState;
    onChange: (filters: ProjectFiltersState) => void;
    projects: Project[];
    hideClientFilters?: boolean;
};

export function ProjectFiltersForm({
    filters,
    onChange,
    projects,
    hideClientFilters = false,
}: ProjectFiltersFormProps) {
    const categorySelected = filters.categorySlug !== "toate";
    const subcategoryOptions = categorySelected
        ? PROJECT_SUBCATEGORIES[filters.categorySlug] ?? []
        : [];

    const update = (patch: Partial<ProjectFiltersState>) => {
        const next = { ...filters, ...patch };
        if (patch.categorySlug && patch.categorySlug !== filters.categorySlug) {
            next.subcategories = [];
        }
        onChange(next);
    };

    const statusOptions = useMemo(
        () => [
            {
                value: "toate",
                label: "Toate stadiile",
            },
            ...PROJECT_STATUSES.map((status) => ({
                value: status,
                label: status,
                count: countProjectsForFilterOption(projects, filters, "status", status),
            })),
        ],
        [projects, filters]
    );

    const categoryOptions = useMemo(
        () =>
            HERO_CATEGORIES.map((cat) => ({
                value: cat.slug,
                label: cat.label,
                count: countProjectsForFilterOption(projects, filters, "categorySlug", cat.slug),
            })),
        [projects, filters]
    );

    const subcategoryListOptions = useMemo(
        () =>
            subcategoryOptions.map((sub) => ({
                value: sub,
                label: sub,
                count: countProjectsForFilterOption(projects, filters, "subcategory", sub),
            })),
        [projects, filters, subcategoryOptions]
    );

    const countyOptions = useMemo(() => {
        const counties = [...new Set(projects.map((p) => p.county))].sort((a, b) =>
            a.localeCompare(b, "ro")
        );
        return counties.map((county) => ({
            value: county,
            label: county,
            count: countProjectsForFilterOption(projects, filters, "county", county),
        }));
    }, [projects, filters]);

    const clientTypeOptions = useMemo(
        () =>
            (["persoana-fizica", "companie"] as const).map((type) => ({
                value: type,
                label: getClientTypeLabel(type),
                count: countProjectsForFilterOption(projects, filters, "clientType", type),
            })),
        [projects, filters]
    );

    const clientRatingCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const option of ["5", "4", "3", "2", "1"] as const) {
            counts[option] = countProjectsForFilterOption(
                projects,
                filters,
                "clientRatingMin",
                option
            );
        }
        return counts;
    }, [projects, filters]);

    return (
        <div>
            <FilterSection title="Stadiu">
                <StatusSelect
                    value={filters.status}
                    options={statusOptions}
                    onChange={(status) => update({ status })}
                />
            </FilterSection>

            <FilterSection title="Buget">
                <BudgetRangeFilter
                    min={filters.budgetMin}
                    max={filters.budgetMax}
                    onChange={(budgetMin, budgetMax) => update({ budgetMin, budgetMax })}
                />
            </FilterSection>

            <FilterSection title="Categorie">
                <FilterCheckboxList
                    options={categoryOptions}
                    value={filters.categorySlug}
                    onChange={(categorySlug) => update({ categorySlug })}
                    searchable
                    searchPlaceholder="Caută categorie..."
                    visibleCount={5}
                />
            </FilterSection>

            {categorySelected && subcategoryListOptions.length > 0 && (
                <FilterSection title="Subcategorie">
                    <FilterCheckboxMultiList
                        options={subcategoryListOptions}
                        values={filters.subcategories}
                        onChange={(subcategories) => update({ subcategories })}
                        visibleCount={6}
                    />
                </FilterSection>
            )}

            <FilterSection title="Locație">
                <FilterCheckboxList
                    options={countyOptions}
                    value={filters.county}
                    onChange={(county) => update({ county })}
                    searchable
                    searchPlaceholder="Caută județ..."
                    visibleCount={5}
                />
            </FilterSection>

            {!hideClientFilters && (
                <>
                    <FilterSection title="Tip client">
                        <FilterCheckboxList
                            options={clientTypeOptions}
                            value={filters.clientType}
                            onChange={(clientType) => update({ clientType })}
                            visibleCount={5}
                        />
                    </FilterSection>

                    <FilterSection title="Rating client">
                        <ClientRatingFilter
                            value={filters.clientRatingMin}
                            onChange={(clientRatingMin) => update({ clientRatingMin })}
                            counts={clientRatingCounts}
                        />
                    </FilterSection>
                </>
            )}
        </div>
    );
}

export default ProjectFiltersForm;

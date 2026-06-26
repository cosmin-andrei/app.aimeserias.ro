"use client";

import { useMemo } from "react";
import { ClientRatingFilter } from "@/components/listing/ClientRatingFilter";
import { FilterCheckboxList } from "@/components/listing/FilterCheckboxList";
import { FilterSection } from "@/components/listing/FilterSection";
import { MeseriasTypeSelect } from "@/components/listing/MeseriasTypeSelect";
import { HERO_CATEGORIES } from "@/data/heroCategories";
import {
    countMeseriasForFilterOption,
    getMeseriasFilterTypeLabel,
    type MeseriasFiltersState,
} from "@/lib/meserias";
import type { Meserias } from "@/types/meserias";

type MeseriasFiltersFormProps = {
    filters: MeseriasFiltersState;
    onChange: (filters: MeseriasFiltersState) => void;
    meseriasi: Meserias[];
};

export function MeseriasFiltersForm({
    filters,
    onChange,
    meseriasi,
}: MeseriasFiltersFormProps) {
    const update = (patch: Partial<MeseriasFiltersState>) => {
        onChange({ ...filters, ...patch });
    };

    const typeOptions = useMemo(
        () => [
            {
                value: "toate",
                label: getMeseriasFilterTypeLabel("toate"),
            },
            ...(["individual", "pfa", "firma"] as const).map((type) => ({
                value: type,
                label: getMeseriasFilterTypeLabel(type),
                count: countMeseriasForFilterOption(meseriasi, filters, "type", type),
            })),
        ],
        [meseriasi, filters]
    );

    const categoryOptions = useMemo(
        () =>
            HERO_CATEGORIES.map((cat) => ({
                value: cat.slug,
                label: cat.label,
                count: countMeseriasForFilterOption(meseriasi, filters, "category", cat.slug),
            })),
        [meseriasi, filters]
    );

    const cityOptions = useMemo(() => {
        const cities = [...new Set(meseriasi.map((m) => m.city))].sort((a, b) =>
            a.localeCompare(b, "ro")
        );
        return cities.map((city) => ({
            value: city,
            label: city,
            count: countMeseriasForFilterOption(meseriasi, filters, "city", city),
        }));
    }, [meseriasi, filters]);

    const ratingCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const option of ["5", "4", "3", "2", "1"] as const) {
            counts[option] = countMeseriasForFilterOption(meseriasi, filters, "ratingMin", option);
        }
        return counts;
    }, [meseriasi, filters]);

    const verifiedOptions = useMemo(
        () => [
            {
                value: "da",
                label: "Doar verificați",
                count: countMeseriasForFilterOption(meseriasi, filters, "verified", "da"),
            },
        ],
        [meseriasi, filters]
    );

    return (
        <div>
            <FilterSection title="Tip">
                <MeseriasTypeSelect
                    value={filters.type}
                    options={typeOptions}
                    onChange={(type) => update({ type: type as MeseriasFiltersState["type"] })}
                />
            </FilterSection>

            <FilterSection title="Categorie">
                <FilterCheckboxList
                    options={categoryOptions}
                    value={filters.category}
                    onChange={(category) => update({ category })}
                    searchable
                    searchPlaceholder="Caută categorie..."
                    visibleCount={5}
                />
            </FilterSection>

            <FilterSection title="Locație">
                <FilterCheckboxList
                    options={cityOptions}
                    value={filters.city}
                    onChange={(city) => update({ city })}
                    searchable
                    searchPlaceholder="Caută oraș..."
                    visibleCount={5}
                />
            </FilterSection>

            <FilterSection title="Rating">
                <ClientRatingFilter
                    value={filters.ratingMin}
                    onChange={(ratingMin) => update({ ratingMin })}
                    counts={ratingCounts}
                />
            </FilterSection>

            <FilterSection title="Verificare">
                <FilterCheckboxList
                    options={verifiedOptions}
                    value={filters.verified}
                    onChange={(verified) => update({ verified })}
                    visibleCount={5}
                />
            </FilterSection>
        </div>
    );
}

export default MeseriasFiltersForm;

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { SortSelect } from "@/components/listing/SortSelect";
import { useUser } from "@/hooks/useUser";
import { listCompanies, listWorkers } from "@/lib/api-client";
import {
    DEFAULT_MESERIAS_FILTERS,
    filterMeseriasi,
    MESERIAS_SORT_OPTIONS,
    resolveDefaultMeseriasCityFilter,
    sortMeseriasi,
    type MeseriasFiltersState,
    type MeseriasSortOption,
} from "@/lib/meserias";
import { companyProfileToMeserias, workerProfileToMeserias } from "@/lib/marketplace-mappers";
import { listingGridClass, listingPageClass } from "@/lib/page-layout";
import type { Meserias } from "@/types/meserias";
import { Pagination } from "../proiecte/Pagination";
import { MeseriasActiveFilters } from "./MeseriasActiveFilters";
import { MeseriasCard } from "./MeseriasCard";
import { MeseriasFiltersMobile } from "./MeseriasFiltersMobile";
import { MeseriasMyProfileButton } from "./MeseriasMyProfileButton";

const MESERIASI_PER_PAGE = 12;

export default function MeseriasiListing() {
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();
    const initialCategory = searchParams.get("categorie") ?? "toate";
    const locationInitializedRef = useRef(false);

    const [meseriasi, setMeseriasi] = useState<Meserias[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<MeseriasFiltersState>(() => ({
        ...DEFAULT_MESERIAS_FILTERS,
        category: initialCategory === "toate" ? "toate" : initialCategory,
    }));
    const [sortBy, setSortBy] = useState<MeseriasSortOption>("default");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setLoading(true);
            setLoadError(null);
            const [{ data: workers, error: workersError }, { data: companies, error: companiesError }] =
                await Promise.all([listWorkers(), listCompanies()]);
            if (cancelled) return;
            const merged = [
                ...(workers ?? []).map(workerProfileToMeserias),
                ...(companies ?? []).map(companyProfileToMeserias),
            ];
            setMeseriasi(merged);
            setLoadError(workersError ?? companiesError ?? null);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (userLoading || locationInitializedRef.current || meseriasi.length === 0) return;
        locationInitializedRef.current = true;

        const defaultCity = resolveDefaultMeseriasCityFilter(meseriasi, user);
        if (defaultCity !== "toate") {
            setFilters((prev) => ({ ...prev, city: defaultCity }));
        }
    }, [user, userLoading, meseriasi]);

    useEffect(() => {
        const param = searchParams.get("categorie");
        if (!param || param === "toate") return;
        if (meseriasi.some((m) => m.categories.includes(param))) {
            setFilters((prev) => ({ ...prev, category: param }));
        }
    }, [searchParams, meseriasi]);

    const filteredMeseriasi = useMemo(
        () => sortMeseriasi(filterMeseriasi(meseriasi, filters), sortBy),
        [meseriasi, filters, sortBy]
    );

    const totalPages = Math.max(1, Math.ceil(filteredMeseriasi.length / MESERIASI_PER_PAGE));
    const currentMeseriasi = filteredMeseriasi.slice(
        (currentPage - 1) * MESERIASI_PER_PAGE,
        currentPage * MESERIASI_PER_PAGE
    );

    const handleFiltersChange = (next: MeseriasFiltersState) => {
        setFilters(next);
        setCurrentPage(1);
    };

    const handleSortChange = (next: MeseriasSortOption) => {
        setSortBy(next);
        setCurrentPage(1);
    };

    return (
        <>
            <div className={listingPageClass}>
                <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                    <MeseriasMyProfileButton />
                    <div className="relative min-w-0 flex-1 basis-[12rem] sm:basis-[16rem]">
                        <Search
                            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-[#9CA3AF]"
                            aria-hidden
                        />
                        <input
                            type="search"
                            value={filters.query}
                            onChange={(e) =>
                                handleFiltersChange({
                                    ...filters,
                                    query: e.target.value,
                                })
                            }
                            placeholder="Caută după nume, meserie sau oraș..."
                            className="w-full rounded-lg border border-stroke bg-white py-1.5 pl-8 pr-3 text-xs text-dark shadow-sm outline-none transition-all placeholder:text-dark-5 focus:border-[#0060f0] focus:ring-2 focus:ring-[#0060f0]/15 sm:text-sm dark:border-white/[0.1] dark:bg-[#0f0f11] dark:text-white dark:placeholder:text-[#6B7280] dark:focus:border-[#5b9fff] dark:focus:ring-[#5b9fff]/20"
                            aria-label="Caută meseriași"
                        />
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <div className="w-52">
                            <SortSelect
                                value={sortBy}
                                options={MESERIAS_SORT_OPTIONS}
                                onChange={handleSortChange}
                                ariaLabel="Mod ordonare meseriași"
                            />
                        </div>
                        <MeseriasFiltersMobile
                            filters={filters}
                            meseriasi={meseriasi}
                            onApply={handleFiltersChange}
                        />
                    </div>
                </div>

                <MeseriasActiveFilters filters={filters} onChange={handleFiltersChange} />

                {loading ? (
                    <div className={listingGridClass}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-56 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
                            />
                        ))}
                    </div>
                ) : loadError ? (
                    <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
                        <p className="text-lg font-medium text-dark dark:text-white">{loadError}</p>
                    </div>
                ) : filteredMeseriasi.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
                        <p className="text-lg font-medium text-dark dark:text-white">
                            Niciun meseriaș nu corespunde filtrelor selectate.
                        </p>
                        <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                            Modifică filtrele sau resetează-le pentru a vedea toți meseriașii.
                        </p>
                    </div>
                ) : (
                    <div className={listingGridClass}>
                        {currentMeseriasi.map((meserias) => (
                            <MeseriasCard key={meserias.id} meserias={meserias} />
                        ))}
                    </div>
                )}
            </div>

            {filteredMeseriasi.length > MESERIASI_PER_PAGE && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
            )}
        </>
    );
}

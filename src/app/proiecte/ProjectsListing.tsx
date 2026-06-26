"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SortSelect } from "@/components/listing/SortSelect";
import { useUser } from "@/hooks/useUser";
import { getMyJobs, getMyOffers, searchJobs, type MyJobItem, type MyOfferItem } from "@/lib/api-client";
import { apiJobToProject } from "@/lib/marketplace-mappers";
import {
    DEFAULT_PROJECT_FILTERS,
    filterProjects,
    PROJECT_SORT_OPTIONS,
    resolveDefaultProjectCountyFilter,
    sortProjects,
    type ProjectSortOption,
} from "@/lib/project";
import type { Project } from "@/types/project";
import { normalizeUserRole } from "@/lib/site";
import { listingGridClass, listingPageClass } from "@/lib/page-layout";
import { MyJobCard } from "./MyJobCard";
import { OfferedProjectCard } from "./OfferedProjectCard";
import { Pagination } from "./Pagination";
import { ProjectActiveFilters } from "./ProjectActiveFilters";
import { ProjectCard } from "./ProjectCard";
import { ProjectFiltersMobile } from "./ProjectFiltersMobile";
import { AddProjectButton, ProjectViewTabs, type ProjectViewMode } from "./ProjectViewTabs";

const PROJECTS_PER_PAGE = 12;

function parseViewMode(param: string | null, isClient: boolean): ProjectViewMode {
    if (isClient) {
        return param === "mine" ? "mine" : "all";
    }
    if (param === "all" || param === "mine" || param === "offered") return param;
    return "all";
}

export default function ProjectsListing() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();
    const role = normalizeUserRole(user?.role);
    const isClient = role === "client";
    const isWorker = role === "worker";
    const canPublishProjects = isClient || isWorker;
    const locationInitializedRef = useRef(false);

    const [catalogProjects, setCatalogProjects] = useState<Project[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ProjectViewMode>(() =>
        parseViewMode(searchParams.get("view"), false)
    );
    const [filters, setFilters] = useState(DEFAULT_PROJECT_FILTERS);
    const [sortBy, setSortBy] = useState<ProjectSortOption>("newest");
    const [currentPage, setCurrentPage] = useState(1);

    const [myJobs, setMyJobs] = useState<MyJobItem[]>([]);
    const [myOffers, setMyOffers] = useState<MyOfferItem[]>([]);
    const [loadingPersonal, setLoadingPersonal] = useState(false);
    const [personalError, setPersonalError] = useState<string | null>(null);

    useEffect(() => {
        setViewMode(parseViewMode(searchParams.get("view"), isClient));
    }, [searchParams, isClient]);

    useEffect(() => {
        if (!isClient || searchParams.get("view") !== "offered") return;
        const params = new URLSearchParams(searchParams.toString());
        params.delete("view");
        const query = params.toString();
        router.replace(query ? `/proiecte?${query}` : "/proiecte", { scroll: false });
    }, [isClient, searchParams, router]);

    useEffect(() => {
        if (viewMode !== "mine") return;
        setFilters((prev) => {
            if (prev.clientType === "toate" && prev.clientRatingMin === "toate") return prev;
            return { ...prev, clientType: "toate", clientRatingMin: "toate" };
        });
    }, [viewMode]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setCatalogLoading(true);
            setCatalogError(null);
            const { data, error } = await searchJobs({ status: "open" });
            if (cancelled) return;
            setCatalogProjects((data ?? []).map((job) => apiJobToProject(job)));
            setCatalogError(error ?? null);
            setCatalogLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (userLoading || locationInitializedRef.current || catalogProjects.length === 0) return;
        locationInitializedRef.current = true;

        if (!isWorker) return;

        const defaultCounty = resolveDefaultProjectCountyFilter(catalogProjects, user);
        if (defaultCounty !== "toate") {
            setFilters((prev) => ({ ...prev, county: defaultCounty }));
        }
    }, [user, userLoading, isWorker, catalogProjects]);

    useEffect(() => {
        if (viewMode === "mine" && canPublishProjects) {
            let cancelled = false;
            setLoadingPersonal(true);
            setPersonalError(null);

            void (async () => {
                const { data, error } = await getMyJobs();
                if (cancelled) return;
                setMyJobs(data ?? []);
                setPersonalError(error ?? null);
                setLoadingPersonal(false);
            })();

            return () => {
                cancelled = true;
            };
        }

        if (viewMode === "offered" && isWorker) {
            let cancelled = false;
            setLoadingPersonal(true);
            setPersonalError(null);

            void (async () => {
                const { data, error } = await getMyOffers();
                if (cancelled) return;
                setMyOffers(data ?? []);
                setPersonalError(error ?? null);
                setLoadingPersonal(false);
            })();

            return () => {
                cancelled = true;
            };
        }

        setLoadingPersonal(false);
        setPersonalError(null);
        return undefined;
    }, [viewMode, canPublishProjects, isWorker]);

    const filteredProjects = useMemo(
        () => sortProjects(filterProjects(catalogProjects, filters), sortBy),
        [catalogProjects, filters, sortBy]
    );

    const sortedMyJobs = useMemo(() => {
        const list = [...myJobs];
        switch (sortBy) {
            case "budget-asc":
                return list.sort((a, b) => (a.budget_min ?? 0) - (b.budget_min ?? 0));
            case "budget-desc":
                return list.sort((a, b) => (b.budget_max ?? 0) - (a.budget_max ?? 0));
            default:
                return list.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
        }
    }, [myJobs, sortBy]);

    const sortedMyOffers = useMemo(() => {
        const list = [...myOffers];
        switch (sortBy) {
            case "budget-asc":
                return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
            case "budget-desc":
                return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
            default:
                return list.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
        }
    }, [myOffers, sortBy]);

    const browseList = filteredProjects;

    const personalListLength =
        viewMode === "all"
            ? browseList.length
            : viewMode === "mine"
              ? canPublishProjects
                  ? sortedMyJobs.length
                  : 0
              : isClient
                ? 0
                : sortedMyOffers.length;

    const totalPages = Math.max(1, Math.ceil(personalListLength / PROJECTS_PER_PAGE));

    const currentBrowseProjects = browseList.slice(
        (currentPage - 1) * PROJECTS_PER_PAGE,
        currentPage * PROJECTS_PER_PAGE
    );
    const currentMyJobs = sortedMyJobs.slice(
        (currentPage - 1) * PROJECTS_PER_PAGE,
        currentPage * PROJECTS_PER_PAGE
    );
    const currentOffers = sortedMyOffers.slice(
        (currentPage - 1) * PROJECTS_PER_PAGE,
        currentPage * PROJECTS_PER_PAGE
    );

    const handleViewChange = (next: ProjectViewMode) => {
        setViewMode(next);
        setCurrentPage(1);
        const params = new URLSearchParams(searchParams.toString());
        const defaultView: ProjectViewMode = "all";
        if (next === defaultView) {
            params.delete("view");
        } else {
            params.set("view", next);
        }
        const query = params.toString();
        router.replace(query ? `/proiecte?${query}` : "/proiecte", { scroll: false });
    };

    const handleFiltersChange = (next: typeof filters) => {
        setFilters(next);
        setCurrentPage(1);
    };

    const handleSortChange = (next: ProjectSortOption) => {
        setSortBy(next);
        setCurrentPage(1);
    };

    const showAddProject = canPublishProjects;

    return (
        <>
            <div className={listingPageClass}>
                <div
                    className={`mb-4 flex flex-wrap items-center gap-2 sm:gap-3 ${isClient ? "justify-end" : ""}`}
                >
                    {!isClient && (
                        <ProjectViewTabs value={viewMode} onChange={handleViewChange} />
                    )}
                    <div
                        className={`flex flex-wrap items-center gap-2 sm:gap-3 ${isClient ? "" : "ml-auto"}`}
                    >
                        {showAddProject && <AddProjectButton />}
                        <div className="w-52">
                            <SortSelect
                                value={sortBy}
                                options={PROJECT_SORT_OPTIONS}
                                onChange={handleSortChange}
                                ariaLabel="Mod ordonare proiecte"
                            />
                        </div>
                        <ProjectFiltersMobile
                            filters={filters}
                            projects={catalogProjects}
                            onApply={handleFiltersChange}
                            hideClientFilters={viewMode === "mine"}
                        />
                    </div>
                </div>

                <ProjectActiveFilters filters={filters} onChange={handleFiltersChange} />

                {loadingPersonal ? (
                    <div className={listingGridClass}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-56 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
                            />
                        ))}
                    </div>
                ) : personalError ? (
                    <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
                        <p className="text-lg font-medium text-dark dark:text-white">{personalError}</p>
                    </div>
                ) : viewMode === "mine" && canPublishProjects ? (
                    sortedMyJobs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
                            <p className="text-lg font-medium text-dark dark:text-white">
                                Nu ai proiecte publicate încă
                            </p>
                            <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                                Adaugă un proiect nou pentru a primi oferte.
                            </p>
                            <div className="mt-5 flex justify-center">
                                <AddProjectButton />
                            </div>
                        </div>
                    ) : (
                        <div className={listingGridClass}>
                            {currentMyJobs.map((job) => (
                                <MyJobCard key={job.id} job={job} />
                            ))}
                        </div>
                    )
                ) : viewMode === "offered" ? (
                    sortedMyOffers.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
                            <p className="text-lg font-medium text-dark dark:text-white">
                                Nicio ofertă trimisă încă
                            </p>
                            <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                                Explorează proiectele disponibile și trimite prima ta ofertă.
                            </p>
                            <button
                                type="button"
                                onClick={() => handleViewChange("all")}
                                className="mt-4 text-sm font-medium text-[#0060f0] hover:underline dark:text-[#5b9fff]"
                            >
                                Vezi toate proiectele
                            </button>
                        </div>
                    ) : (
                        <div className={listingGridClass}>
                            {currentOffers.map((offer) => (
                                <OfferedProjectCard key={offer.id} offer={offer} />
                            ))}
                        </div>
                    )
                ) : viewMode === "all" && catalogLoading ? (
                    <div className={listingGridClass}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-56 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
                            />
                        ))}
                    </div>
                ) : viewMode === "all" && catalogError ? (
                    <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
                        <p className="text-lg font-medium text-dark dark:text-white">{catalogError}</p>
                    </div>
                ) : browseList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stroke bg-white py-16 text-center dark:border-white/[0.1] dark:bg-[#141414]">
                        <p className="text-lg font-medium text-dark dark:text-white">
                            Niciun proiect nu corespunde filtrelor selectate.
                        </p>
                        <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                            Modifică filtrele sau resetează-le pentru a vedea toate proiectele.
                        </p>
                    </div>
                ) : (
                    <div className={listingGridClass}>
                        {currentBrowseProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>

            {personalListLength > PROJECTS_PER_PAGE && (
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    MapPin,
    Pencil,
    Star,
    User,
} from "lucide-react";
import { BrandGradientPlaceholder } from "@/components/BrandGradientPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { useUser } from "@/hooks/useUser";
import {
    appUserToProfile,
    fetchMyWorkerProfile,
    getProfilePictureUrl,
    getUserDisplayName,
    parseSpecializations,
    type AppUser,
    type WorkerProfile,
} from "@/lib/api-client";
import { getPublicDisplayName } from "@/lib/auth-client";
import { isCompanyAccount } from "@/lib/company-account";
import { PFA_TYPE_LABEL } from "@/lib/meserias";
import { resolveProfileAvatarUrl } from "@/lib/media";
import { normalizeUserRole } from "@/lib/site";
import { detailPageClass } from "@/lib/page-layout";
import { DomainStudiesBadge } from "./DomainStudiesBadge";
import { MeseriasProfileSidebar } from "./MeseriasProfileSidebar";
import { PortfolioGallery } from "./PortfolioGallery";
import { SpecializationChip } from "@/components/SpecializationChip";
import { MyCompanyPublicProfileView } from "./MyCompanyPublicProfileView";

function formatMemberSince(date: string | null | undefined) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
}

function getProfileCity(user: AppUser | null, fallbackCity: string | null | undefined): string {
    const addresses = user?.addresses ?? [];
    const domiciliu = addresses.find((a) => a.addressType === "domiciliu");
    if (domiciliu?.city?.trim()) return domiciliu.city.trim();

    const resedinta = addresses.find(
        (a) => a.addressType === "resedinta" || a.addressType === "postala"
    );
    if (resedinta?.city?.trim()) return resedinta.city.trim();

    return fallbackCity?.trim() || "Nespecificat";
}

export function MyPublicProfileView() {
    const { user, loading: userLoading } = useUser();

    if (userLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-dark-5 dark:text-[#9CA3AF]">
                <span
                    className="mr-2 size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                    aria-hidden
                />
                Se încarcă profilul public…
            </div>
        );
    }

    if (user && normalizeUserRole(user.role) === "worker" && isCompanyAccount(user)) {
        return <MyCompanyPublicProfileView />;
    }

    return <MyIndividualPublicProfileView />;
}

function MyIndividualPublicProfileView() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const role = normalizeUserRole(user?.role);
    const [loading, setLoading] = useState(true);
    const [worker, setWorker] = useState<WorkerProfile | null>(null);
    const [profileUser, setProfileUser] = useState<AppUser | null>(null);

    useEffect(() => {
        if (userLoading) return;

        if (!user || role !== "worker") {
            router.replace("/setari");
            return;
        }

        let cancelled = false;
        setLoading(true);

        void fetchMyWorkerProfile().then(({ success, data }) => {
            if (cancelled) return;
            if (success && data) {
                setWorker(data.worker);
                setProfileUser(data.user);
            }
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [user, userLoading, role, router]);

    const displayName = useMemo(() => {
        if (profileUser) {
            return getPublicDisplayName(appUserToProfile(profileUser)) || getUserDisplayName(profileUser);
        }
        return user ? getPublicDisplayName(user) || user.name : "Meseriaș";
    }, [profileUser, user]);

    const avatarUrl = useMemo(() => {
        if (profileUser) return resolveProfileAvatarUrl(appUserToProfile(profileUser));
        return resolveProfileAvatarUrl(user);
    }, [profileUser, user]);

    const specializations = parseSpecializations(worker?.specializations);
    const studiesVerified = new Set(profileUser?.studies_verified_specializations ?? []);
    const sortedTrades = [...specializations].sort((a, b) => {
        const aVerified = studiesVerified.has(a);
        const bVerified = studiesVerified.has(b);
        if (aVerified && !bVerified) return -1;
        if (!aVerified && bVerified) return 1;
        return a.localeCompare(b, "ro");
    });

    const coverUrl = getProfilePictureUrl(worker?.cover_image ?? null);
    const displayCity = getProfileCity(profileUser, worker?.city ?? profileUser?.city);
    const hasPfa = !!profileUser?.has_pfa;
    const hasDomainStudies = !!profileUser?.has_domain_studies;
    const typeLabel = hasPfa ? PFA_TYPE_LABEL : "Meseriaș";

    if (userLoading || loading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-dark-5 dark:text-[#9CA3AF]">
                <span
                    className="mr-2 size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                    aria-hidden
                />
                Se încarcă profilul public…
            </div>
        );
    }

    if (!worker) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <p className="text-lg font-medium text-dark dark:text-white">
                    Profilul public nu este încă configurat
                </p>
                <p className="mt-2 text-sm text-dark-5 dark:text-[#9CA3AF]">
                    Completează meseria și detaliile profilului pentru a apărea în marketplace.
                </p>
                <Link
                    href="/setari?tab=public"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#002050] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#001040] dark:bg-[#f1f6ff] dark:text-[#08080a] dark:hover:bg-white"
                >
                    <Pencil className="size-4" aria-hidden />
                    Configurează profilul public
                </Link>
            </div>
        );
    }

    return (
        <section className="pb-10 pt-2 md:pb-14 md:pt-4">
            <div className={detailPageClass}>
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#002050]/10 bg-[#fafcff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-[#141414]">
                    <p className="text-sm text-gray-600 dark:text-[#9CA3AF]">
                        Previzualizare profil public — așa te văd ceilalți utilizatori în
                        marketplace.
                    </p>
                    <Link
                        href="/setari?tab=public"
                        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0060f0] hover:underline dark:text-[#5b9fff]"
                    >
                        <Pencil className="size-4" aria-hidden />
                        Editează profilul
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-8 2xl:grid-cols-[1.35fr_0.65fr] 2xl:gap-10">
                    <div className="overflow-hidden rounded-2xl border border-[#002050]/10 bg-white shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:bg-[#141414] dark:ring-white/[0.06]">
                        <div className="relative h-44 w-full overflow-hidden sm:h-52 md:h-56">
                            {coverUrl ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={coverUrl}
                                        alt={`Lucrări realizate de ${displayName}`}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001535]/75 via-[#001535]/25 to-transparent" />
                                </>
                            ) : (
                                <BrandGradientPlaceholder showBottomOverlay />
                            )}

                            <Link
                                href="/meseriasi"
                                className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-5 sm:top-5"
                            >
                                <ArrowLeft className="size-3.5" aria-hidden />
                                Înapoi la meseriași
                            </Link>

                            {worker.verified && (
                                <span className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm sm:right-5 sm:top-5">
                                    <CheckCircle2 className="size-3.5 text-white" aria-hidden />
                                    Verificat
                                </span>
                            )}
                        </div>

                        <div className="relative px-5 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-5">
                                <div className="-mt-10 shrink-0 sm:-mt-12">
                                    <div className="relative h-[6.5rem] w-[6.5rem] overflow-hidden rounded-full bg-white ring-4 ring-white shadow-lg dark:bg-[#141414] dark:ring-[#141414] sm:h-28 sm:w-28 sm:ring-[5px]">
                                        <UserAvatar
                                            src={avatarUrl}
                                            alt={displayName}
                                            sizes="112px"
                                            priority
                                        />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 sm:pb-1 sm:pt-3">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                                        {displayName}
                                    </h1>
                                    <p className="mt-2 text-base text-gray-600 dark:text-[#9CA3AF]">
                                        {worker.profession}
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0060f0]/10 px-3 py-1 text-xs font-semibold text-[#0060f0] dark:bg-white/[0.08] dark:text-[#c5d4f5]">
                                            <User className="size-2.5" aria-hidden />
                                            {typeLabel}
                                        </span>
                                        {hasDomainStudies && <DomainStudiesBadge />}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-[#9CA3AF] sm:mt-7">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-4 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                                    {displayCity}
                                </span>
                                <span className="flex items-center gap-1.5 font-semibold text-[#002050] dark:text-[#f1f6ff]">
                                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                                    {(worker.average_rating ?? 0).toFixed(1)} ({worker.total_reviews ?? 0})
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Briefcase className="size-4" aria-hidden />
                                    {worker.completed_jobs ?? 0} proiecte finalizate
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="size-4" aria-hidden />
                                    Membru din {formatMemberSince(profileUser?.created_at ?? worker.created_at)}
                                </span>
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Despre</h2>
                                <p className="mt-2 leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                                    {worker.description?.trim() || "Nicio descriere încă."}
                                </p>
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Specializări</h2>
                                {sortedTrades.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {sortedTrades.map((trade) => (
                                            <SpecializationChip
                                                key={trade}
                                                label={trade}
                                                hasStudies={studiesVerified.has(trade)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-[#9CA3AF]">
                                        Nicio specializare adăugată.
                                    </p>
                                )}
                            </div>

                            <PortfolioGallery items={[]} />
                        </div>
                    </div>

                    <div className="lg:sticky lg:top-24">
                        <MeseriasProfileSidebar
                            meseriasName={displayName}
                            rating={worker.average_rating ?? 0}
                            reviewCount={worker.total_reviews ?? 0}
                            previewReviews={[]}
                            phone={profileUser?.phone}
                            email={profileUser?.email}
                            workerUserId={profileUser?.id}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

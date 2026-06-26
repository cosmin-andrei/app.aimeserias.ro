import Link from "next/link";
import { BadgeCheck, MapPin, Star, User, Users } from "lucide-react";
import { BrandGradientPlaceholder } from "@/components/BrandGradientPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { getMeseriasDisplayTypeLabel } from "@/lib/meserias";
import type { Meserias } from "@/types/meserias";

type MeseriasCardProps = {
    meserias: Meserias;
};

export function MeseriasCard({ meserias }: MeseriasCardProps) {
    const typeLabel = getMeseriasDisplayTypeLabel(meserias);
    const projectsLabel = `${meserias.completedProjects} proiecte finalizate`;
    const reviewsLabel = `(${meserias.reviewCount})`;

    return (
        <Link
            href={`/meseriasi/${meserias.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-white shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[#16366d]/15 dark:bg-[#141414] dark:ring-white/[0.06] dark:hover:ring-[#f1f6ff]/20"
        >
            <div className="relative h-24 shrink-0 overflow-hidden">
                <BrandGradientPlaceholder showBottomOverlay />

                {meserias.verified && (
                    <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                        <BadgeCheck className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                        Verificat
                    </span>
                )}

                <div className="absolute inset-x-0 bottom-3 flex items-center justify-end gap-1 px-4">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    <span className="text-sm font-bold tabular-nums text-white">
                        {meserias.rating.toFixed(1)}
                    </span>
                    <span className="text-xs font-medium text-white/80">{reviewsLabel}</span>
                </div>
            </div>

            <div className="flex flex-1 flex-col px-4 pb-4">
                <div className="-mt-9 flex gap-2.5 pt-1">
                    <div className="relative shrink-0">
                        <div className="rounded-full bg-gradient-to-br from-white/90 via-white to-white/80 p-[3px] shadow-lg dark:from-[#141414] dark:via-[#1a1a1a] dark:to-[#141414]">
                            <div className="rounded-full bg-gradient-to-br from-[#0060f0] to-[#002050] p-[2px]">
                                <UserAvatar
                                    src={meserias.image}
                                    alt={meserias.name}
                                    sizes="84px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    containerClassName="relative h-[5.25rem] w-[5.25rem] overflow-hidden rounded-full bg-[#002050]/5 dark:bg-white/[0.04]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="-ml-1 min-w-0 flex-1 pt-[3.15rem]">
                        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#16366d] dark:text-white dark:group-hover:text-[#f1f6ff]">
                            {meserias.name}
                        </h3>
                        <span className="mt-1.5 inline-flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#0060f0]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#0060f0] dark:bg-white/[0.08] dark:text-[#c5d4f5]">
                                {meserias.type === "firma" ? (
                                    <>
                                        <Users className="h-3 w-3 shrink-0" aria-hidden />
                                        <span className="line-clamp-2">{typeLabel}</span>
                                        {meserias.teamSize ? ` · ${meserias.teamSize} pers.` : ""}
                                    </>
                                ) : (
                                    <>
                                        <User className="h-3 w-3 shrink-0" aria-hidden />
                                        <span className="line-clamp-2">{typeLabel}</span>
                                    </>
                                )}
                            </span>
                        </span>
                    </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-[#9CA3AF]">
                    {meserias.tagline}
                </p>

                <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-500 dark:text-[#9CA3AF]">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0060f0]/70 dark:text-[#5b9fff]" aria-hidden />
                        <span className="truncate">{meserias.location}</span>
                    </span>
                    <span className="text-gray-300 dark:text-white/20" aria-hidden>
                        ·
                    </span>
                    <span className="font-medium text-gray-600 dark:text-[#E5E7EB]">{projectsLabel}</span>
                </p>

                {meserias.trades.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {meserias.trades.slice(0, 3).map((trade) => (
                            <span
                                key={trade}
                                className="rounded-full bg-[#fafcff] px-2.5 py-1 text-[10px] font-medium text-[#002050]/70 ring-1 ring-[#002050]/8 dark:bg-white/[0.06] dark:text-[#c5d4f5] dark:ring-white/[0.08]"
                            >
                                {trade}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}

export default MeseriasCard;

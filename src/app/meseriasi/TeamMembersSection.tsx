"use client";

import { useCallback, useEffect, useState } from "react";
import { LOGIN_URL, REGISTER_URL } from "@/lib/auth-routes";
import type { FirmaTeamMember } from "@/types/meseriasProfile";
import { Sparkles, X } from "lucide-react";
import { GatedOverlay } from "./AuthPrompt";
import { PortfolioGallery } from "./PortfolioGallery";
import { MemberAvatar, MemberRating, ReviewPreviewCard } from "./ReviewPreviewCard";

const MODAL_ANIMATION_MS = 280;
type TeamMemberCompactCardProps = {
    member: FirmaTeamMember;
    onClick: () => void;
};

function TeamMemberCompactCard({ member, onClick }: TeamMemberCompactCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-full flex-col items-center rounded-xl border border-[#002050]/10 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0060f0]/25 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0060f0]/40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-[#5b9fff]/30 dark:hover:bg-white/[0.05]"
        >
            <MemberAvatar name={member.name} image={member.image} size="lg" />
            <h3 className="mt-3 line-clamp-1 w-full text-sm font-bold text-gray-900 group-hover:text-[#002050] dark:text-white dark:group-hover:text-[#c5d4f5]">
                {member.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 w-full text-xs text-[#0060f0]/80 dark:text-[#5b9fff]/90">{member.role}</p>
            <div className="mt-1 flex w-full justify-center">
                <MemberRating rating={member.rating} reviewCount={member.reviewCount} />
            </div>
        </button>
    );
}

type TeamMemberProfileModalProps = {
    member: FirmaTeamMember;
    firmaName: string;
    onClose: () => void;
};

function TeamMemberProfileModal({ member, firmaName, onClose }: TeamMemberProfileModalProps) {
    const loginUrl = LOGIN_URL;
    const registerUrl = REGISTER_URL;
    const previewReview = member.reviews[0];
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);

    const handleClose = useCallback(() => {
        if (closing) return;
        setClosing(true);
        setVisible(false);
        window.setTimeout(onClose, MODAL_ANIMATION_MS);
    }, [closing, onClose]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [handleClose]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center p-0 transition-opacity duration-300 ease-out sm:items-center sm:p-6 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={`Profil ${member.name}`}
            onClick={handleClose}
        >
            <div
                className={`absolute inset-0 bg-[#001535]/55 backdrop-blur-md transition-opacity duration-300 ease-out ${
                    visible ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden
            />

            <div
                className={`relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_24px_60px_-20px_rgba(0,32,80,0.35)] transition-all duration-300 ease-out sm:max-w-xl sm:rounded-3xl dark:bg-[#141414] dark:shadow-black/50 ${
                    visible
                        ? "translate-y-0 opacity-100 sm:scale-100"
                        : "translate-y-full opacity-0 sm:translate-y-4 sm:scale-[0.97]"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-white/20 sm:hidden" />

                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm ring-1 ring-black/5 backdrop-blur-sm hover:bg-white dark:bg-white/10 dark:text-[#E5E7EB] dark:ring-white/10 dark:hover:bg-white/15 sm:right-5 sm:top-5"
                    aria-label="Închide"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="relative flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="shrink-0 rounded-full bg-gradient-to-br from-[#0060f0] to-[#002050] p-[3px] shadow-md">
                            <div className="rounded-full bg-white p-[3px] dark:bg-[#141414]">
                                <MemberAvatar name={member.name} image={member.image} size="xl" />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 pt-1">
                            <h3 className="pr-8 text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">
                                {member.name}
                            </h3>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#0060f0] dark:text-[#5b9fff]">
                                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                {member.role}
                            </p>
                            <MemberRating rating={member.rating} reviewCount={member.reviewCount} />
                            <p className="mt-1.5 text-xs text-gray-500 dark:text-[#9CA3AF]">Membru echipă · {firmaName}</p>

                            {member.portfolio.length > 0 && (
                                <PortfolioGallery
                                    items={member.portfolio}
                                    variant="embedded"
                                    title="Lucrări realizate"
                                    description=""
                                />
                            )}

                            {previewReview && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Recenzii</h4>
                                    <GatedOverlay
                                        loginUrl={loginUrl}
                                        registerUrl={registerUrl}
                                        message={`Necesită autentificare pentru a citi recenziile clienților despre ${member.name}`}
                                        minHeight="min-h-[100px]"
                                        showAuthButtons={false}
                                    >
                                        <ReviewPreviewCard review={previewReview} blurred />
                                    </GatedOverlay>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

type TeamMembersSectionProps = {
    firmaName: string;
    members: FirmaTeamMember[];
};

export function TeamMembersSection({ firmaName, members }: TeamMembersSectionProps) {
    const [selectedMember, setSelectedMember] = useState<FirmaTeamMember | null>(null);

    if (members.length === 0) return null;

    return (
        <>
            <section className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Echipa noastră</h2>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {members.map((member) => (
                        <TeamMemberCompactCard
                            key={member.id}
                            member={member}
                            onClick={() => setSelectedMember(member)}
                        />
                    ))}
                </div>
            </section>

            {selectedMember && (
                <TeamMemberProfileModal
                    member={selectedMember}
                    firmaName={firmaName}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </>
    );
}

export default TeamMembersSection;

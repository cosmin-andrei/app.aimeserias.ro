"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { LOGIN_URL, REGISTER_URL } from "@/lib/auth-routes";
import type { MeseriasReview } from "@/types/meseriasProfile";
import { Lock, Mail, MessageCircle, Phone, Star } from "lucide-react";
import { OpenChatLink } from "@/components/messaging/OpenChatLink";
import { normalizeUserRole } from "@/lib/site";
import { GatedOverlay } from "./AuthPrompt";
import { MeseriasReviewsPopup } from "./MeseriasReviewsPopup";
import { ReviewPreviewCard } from "./ReviewPreviewCard";

const CARD_CLASS =
    "rounded-2xl border border-[#002050]/10 bg-gradient-to-br from-[#fafcff] to-white shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:from-[#141414] dark:to-[#101012] dark:ring-white/[0.06]";

type MeseriasProfileSidebarProps = {
    meseriasName: string;
    rating: number;
    reviewCount: number;
    previewReviews: MeseriasReview[];
    phone?: string;
    email?: string;
    /** ID utilizator meseriaș (pentru deschidere chat) */
    workerUserId?: number;
    /** Afișează contactul și recenziile ca pentru un vizitator neautentificat */
    viewAsVisitor?: boolean;
};

export function MeseriasProfileSidebar({
    meseriasName,
    rating,
    reviewCount,
    previewReviews,
    phone,
    email,
    workerUserId,
    viewAsVisitor = false,
}: MeseriasProfileSidebarProps) {
    const { user } = useUser();
    const role = normalizeUserRole(user?.role);
    const isOwnProfile =
        workerUserId != null && user?.id != null && Number(user.id) === workerUserId;
    const canOpenChat =
        Boolean(workerUserId) && !isOwnProfile && role === "client";
    const loginUrl = LOGIN_URL;
    const registerUrl = REGISTER_URL;
    const previewReview = previewReviews[0];
    const isAuthenticated = Boolean(user) && !viewAsVisitor;
    const totalReviews = reviewCount > 0 ? reviewCount : previewReviews.length;

    const [reviewsOpen, setReviewsOpen] = useState(false);
    const [reviewsClosing, setReviewsClosing] = useState(false);
    const [reviewsEntered, setReviewsEntered] = useState(false);

    useEffect(() => {
        if (!reviewsOpen) {
            setReviewsEntered(false);
            return;
        }
        const frame = requestAnimationFrame(() => {
            requestAnimationFrame(() => setReviewsEntered(true));
        });
        return () => cancelAnimationFrame(frame);
    }, [reviewsOpen]);

    useEffect(() => {
        if (!reviewsClosing) return;
        const timer = setTimeout(() => {
            setReviewsOpen(false);
            setReviewsClosing(false);
        }, 160);
        return () => clearTimeout(timer);
    }, [reviewsClosing]);

    useEffect(() => {
        if (!reviewsOpen) return;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setReviewsClosing(true);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [reviewsOpen]);

    const openReviews = () => setReviewsOpen(true);
    const closeReviews = () => setReviewsClosing(true);

    return (
        <>
            <div className="space-y-4">
                <aside className={`${CARD_CLASS} p-5`} aria-label="Contact și chat">
                    {isAuthenticated ? (
                        <>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Contact</h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-[#9CA3AF]">
                                Date de contact pentru{" "}
                                <span className="font-medium text-gray-900 dark:text-white">{meseriasName}</span>
                            </p>
                            <div className="mt-4 space-y-2">
                                {phone && (
                                    <a
                                        href={`tel:${phone.replace(/\s/g, "")}`}
                                        className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#002050]/8 transition-colors hover:bg-[#fafcff] dark:bg-white/[0.04] dark:ring-white/[0.08] dark:hover:bg-white/[0.06]"
                                    >
                                        <Phone className="h-4 w-4 shrink-0 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                                        <span className="text-sm text-gray-800 dark:text-[#E5E7EB]">{phone}</span>
                                    </a>
                                )}
                                {email && (
                                    <a
                                        href={`mailto:${email}`}
                                        className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#002050]/8 transition-colors hover:bg-[#fafcff] dark:bg-white/[0.04] dark:ring-white/[0.08] dark:hover:bg-white/[0.06]"
                                    >
                                        <Mail className="h-4 w-4 shrink-0 text-[#0060f0] dark:text-[#5b9fff]" aria-hidden />
                                        <span className="text-sm text-gray-800 dark:text-[#E5E7EB]">{email}</span>
                                    </a>
                                )}
                                {!phone && !email && (
                                    <p className="rounded-lg bg-white/80 px-3 py-2.5 text-sm text-gray-500 ring-1 ring-[#002050]/8 dark:bg-white/[0.04] dark:text-[#9CA3AF] dark:ring-white/[0.08]">
                                        Meseriașul nu a partajat date de contact.
                                    </p>
                                )}
                            </div>
                            {canOpenChat && workerUserId ? (
                                <OpenChatLink otherUserId={workerUserId} className="mt-4" />
                            ) : (
                                <p className="mt-4 text-center text-xs text-dark-5 dark:text-[#9CA3AF]">
                                    {isOwnProfile
                                        ? "Previzualizare — vizitatorii vor putea deschide chat aici."
                                        : "Chat indisponibil pentru acest profil."}
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0060f0]/15 text-[#0060f0] dark:bg-white/[0.08] dark:text-[#5b9fff]">
                                    <Lock className="h-4 w-4" aria-hidden />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                                        Pentru a vedea datele de contact sau a discuta în chat cu{" "}
                                        <span className="font-medium text-gray-900 dark:text-white">{meseriasName}</span>,
                                        creează un cont gratuit pe AiMeseriaș.
                                    </p>
                                </div>
                            </div>

                            <GatedOverlay
                                loginUrl={loginUrl}
                                registerUrl={registerUrl}
                                minHeight="min-h-[150px]"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-[#002050]/8 dark:bg-white/[0.04] dark:ring-white/[0.08]">
                                        <MessageCircle className="h-4 w-4 shrink-0 text-gray-400 dark:text-[#6B7280]" aria-hidden />
                                        <span className="text-sm text-gray-400 blur-[3px] dark:text-[#6B7280]">07xx xxx xxx</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-[#002050]/8 dark:bg-white/[0.04] dark:ring-white/[0.08]">
                                        <MessageCircle className="h-4 w-4 shrink-0 text-gray-400 dark:text-[#6B7280]" aria-hidden />
                                        <span className="text-sm text-gray-400 blur-[3px] dark:text-[#6B7280]">contact@exemplu.ro</span>
                                    </div>
                                </div>
                            </GatedOverlay>

                            <p className="mt-2.5 text-xs text-gray-500 dark:text-[#9CA3AF]">
                                După autentificare vei putea trimite mesaje direct în chat.
                            </p>
                        </>
                    )}
                </aside>

                <aside className={`${CARD_CLASS} p-4`} aria-label="Recenzii">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recenzii</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600 dark:text-[#9CA3AF]">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                        <span className="font-bold text-[#002050] dark:text-[#f1f6ff]">{rating.toFixed(1)}</span>
                        <span>({totalReviews})</span>
                    </p>

                    {isAuthenticated && previewReview ? (
                        <div className="mt-3">
                            <ReviewPreviewCard review={previewReview} />
                            {previewReviews.length > 0 && (
                                <button
                                    type="button"
                                    onClick={openReviews}
                                    className="mt-3 w-full text-sm font-medium text-[#0060f0] hover:underline dark:text-[#5b9fff]"
                                >
                                    Vezi toate recenziile ({totalReviews})
                                </button>
                            )}
                        </div>
                    ) : previewReview ? (
                        <GatedOverlay
                            loginUrl={loginUrl}
                            registerUrl={registerUrl}
                            message={`Necesită autentificare pentru a citi recenziile clienților despre ${meseriasName}`}
                            minHeight="min-h-[110px]"
                            showAuthButtons={false}
                        >
                            <ReviewPreviewCard review={previewReview} blurred />
                        </GatedOverlay>
                    ) : (
                        <p className="mt-3 text-xs text-gray-500 dark:text-[#9CA3AF]">Nu există recenzii încă.</p>
                    )}
                </aside>
            </div>

            <MeseriasReviewsPopup
                open={reviewsOpen}
                closing={reviewsClosing}
                entered={reviewsEntered}
                onClose={closeReviews}
                meseriasName={meseriasName}
                rating={rating}
                reviewCount={totalReviews}
                reviews={previewReviews}
            />
        </>
    );
}

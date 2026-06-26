"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PortfolioMedia } from "@/types/meseriasProfile";
import { ChevronLeft, ChevronRight, ExternalLink, Play, X } from "lucide-react";

type PortfolioGalleryProps = {
    items: PortfolioMedia[];
    variant?: "section" | "embedded";
    title?: string;
    description?: string;
};

type LightboxState = { type: "closed" } | { type: "open"; index: number };

const LIGHTBOX_ANIMATION_MS = 280;
const SLIDE_ANIMATION_MS = 220;

type SlideAnimState = {
    phase: "idle" | "out" | "in";
    direction: "next" | "prev";
};

const SLIDE_IDLE: SlideAnimState = { phase: "idle", direction: "next" };

function getSlideMediaClass({ phase, direction }: SlideAnimState) {
    if (phase === "idle") return "translate-x-0 opacity-100";
    if (phase === "out") {
        return direction === "next" ? "-translate-x-6 opacity-0" : "translate-x-6 opacity-0";
    }
    return direction === "next" ? "translate-x-6 opacity-0" : "-translate-x-6 opacity-0";
}

function ProjectLink({ item, className = "" }: { item: PortfolioMedia; className?: string }) {
    if (!item.projectSlug) return null;

    return (
        <Link
            href={`/proiecte/${item.projectSlug}`}
            className={`inline-flex max-w-full items-center gap-1 transition-colors hover:text-[#0060f0] ${className}`}
        >
            <span className="line-clamp-2">{item.projectTitle ?? "Vezi proiectul"}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        </Link>
    );
}

export function PortfolioGallery({
    items,
    variant = "section",
    title = "Galerie lucrări",
    description = "",
}: PortfolioGalleryProps) {
    const [lightbox, setLightbox] = useState<LightboxState>({ type: "closed" });
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const [slideAnim, setSlideAnim] = useState<SlideAnimState>(SLIDE_IDLE);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleClose = useCallback(() => {
        if (closing || lightbox.type === "closed") return;
        setClosing(true);
        setVisible(false);
        setSlideAnim(SLIDE_IDLE);
        window.setTimeout(() => {
            setLightbox({ type: "closed" });
            setClosing(false);
        }, LIGHTBOX_ANIMATION_MS);
    }, [closing, lightbox.type]);

    const openLightbox = useCallback((index: number) => {
        setClosing(false);
        setVisible(false);
        setSlideAnim(SLIDE_IDLE);
        setLightbox({ type: "open", index });
    }, []);

    const navigate = useCallback(
        (direction: "next" | "prev") => {
            if (lightbox.type !== "open" || slideAnim.phase !== "idle") return;

            const delta = direction === "next" ? 1 : -1;
            const nextIndex =
                ((lightbox.index + delta) % items.length + items.length) % items.length;

            setSlideAnim({ phase: "out", direction });
            window.setTimeout(() => {
                setLightbox({ type: "open", index: nextIndex });
                setSlideAnim({ phase: "in", direction });
                requestAnimationFrame(() => {
                    setSlideAnim(SLIDE_IDLE);
                });
            }, SLIDE_ANIMATION_MS);
        },
        [items.length, lightbox, slideAnim.phase],
    );

    useEffect(() => {
        if (lightbox.type !== "open") return;
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, [lightbox.type]);

    const goPrev = useCallback(() => {
        if (lightbox.type !== "open") return;
        navigate("prev");
    }, [lightbox.type, navigate]);

    const goNext = useCallback(() => {
        if (lightbox.type !== "open") return;
        navigate("next");
    }, [lightbox.type, navigate]);

    useEffect(() => {
        if (lightbox.type === "closed") return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
                handleClose();
                return;
            }
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown, true);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKeyDown, true);
        };
    }, [goNext, goPrev, handleClose, lightbox.type]);

    if (items.length === 0) return null;

    const isEmbedded = variant === "embedded";
    const headingClass = isEmbedded
        ? "text-sm font-bold text-gray-900 dark:text-white"
        : "text-lg font-bold text-gray-900 dark:text-white";
    const wrapperClass = isEmbedded
        ? "mt-4"
        : "mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]";

    const activeItem = lightbox.type === "open" ? items[lightbox.index] : null;
    const hasMultiple = items.length > 1;

    const navButtonClass =
        "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 sm:h-10 sm:w-10";

    const slideMediaClass = getSlideMediaClass(slideAnim);
    const slideTransitionClass =
        slideAnim.phase === "in"
            ? "transition-none"
            : "transition-all duration-[220ms] ease-out";

    const lightboxNode =
        activeItem && lightbox.type === "open" ? (
            <div
                className={`fixed inset-0 z-[100] flex items-center justify-center p-3 transition-opacity duration-300 ease-out sm:p-6 ${
                    visible ? "opacity-100" : "opacity-0"
                }`}
                role="dialog"
                aria-modal="true"
                aria-label={activeItem.title}
                onClick={handleClose}
            >
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    aria-hidden
                />

                <div
                    className={`relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-black shadow-2xl transition-all duration-300 ease-out ${
                        visible ? "scale-100 opacity-100" : "scale-[0.96] opacity-0"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative min-h-0 flex-1 bg-black">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                            aria-label="Închide"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {hasMultiple && (
                            <span className="absolute left-3 top-3 z-20 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
                                {lightbox.index + 1} / {items.length}
                            </span>
                        )}

                        {hasMultiple && (
                            <button
                                type="button"
                                onClick={goPrev}
                                className={`${navButtonClass} left-3`}
                                aria-label="Anterior"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}

                        {hasMultiple && (
                            <button
                                type="button"
                                onClick={goNext}
                                className={`${navButtonClass} right-3`}
                                aria-label="Următor"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        )}

                        {activeItem.type === "image" ? (
                            <div
                                className={`relative h-[min(72vh,680px)] w-full ${slideTransitionClass} ${slideMediaClass}`}
                            >
                                <Image
                                    key={activeItem.id}
                                    src={activeItem.url}
                                    alt={activeItem.title}
                                    fill
                                    className="object-contain"
                                    sizes="100vw"
                                    priority
                                />
                            </div>
                        ) : (
                            <div
                                className={`flex h-[min(72vh,680px)] w-full items-center justify-center bg-black ${slideTransitionClass} ${slideMediaClass}`}
                            >
                                <video
                                    key={activeItem.id}
                                    src={activeItem.url}
                                    controls
                                    autoPlay
                                    className="max-h-full max-w-full"
                                    poster={activeItem.thumbnail}
                                />
                            </div>
                        )}
                    </div>

                    <div
                        className={`shrink-0 border-t border-[#002050]/10 bg-white px-4 py-3 dark:border-white/[0.08] dark:bg-[#141414] ${slideTransitionClass} ${slideMediaClass}`}
                    >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activeItem.title}</p>
                        {activeItem.projectSlug && (
                            <ProjectLink
                                item={activeItem}
                                className="mt-1.5 text-sm font-medium text-[#0060f0] dark:text-[#5b9fff]"
                            />
                        )}
                    </div>
                </div>
            </div>
        ) : null;

    return (
        <>
            <div className={wrapperClass}>
                <h3 className={headingClass}>{title}</h3>
                {description && (
                    <p className={`${isEmbedded ? "mt-0.5 text-xs" : "mt-1 text-sm"} text-gray-500 dark:text-[#9CA3AF]`}>
                        {description}
                    </p>
                )}

                <div
                    className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${isEmbedded ? "mt-3" : "mt-4 md:gap-4 gap-3"}`}
                >
                    {items.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => openLightbox(index)}
                            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/[0.06] transition-all hover:shadow-md dark:bg-white/[0.04] dark:ring-white/[0.08] dark:hover:ring-white/[0.14]"
                        >
                            <Image
                                src={item.type === "video" ? (item.thumbnail ?? item.url) : item.url}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, 33vw"
                            />
                            {item.type === "video" && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg">
                                        <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
                                    </span>
                                </span>
                            )}
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-8 text-left text-[11px] font-medium text-white">
                                {item.title}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {mounted && lightboxNode ? createPortal(lightboxNode, document.body) : null}
        </>
    );
}

export default PortfolioGallery;

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BrandGradientPlaceholder } from "@/components/BrandGradientPlaceholder";
import { hasMediaImage } from "@/lib/media";

type ProjectCoverImageProps = {
    src?: string | null;
    alt: string;
    sizes: string;
    priority?: boolean;
    hoverScale?: boolean;
};

export function ProjectCoverImage({
    src,
    alt,
    sizes,
    priority,
    hoverScale = false,
}: ProjectCoverImageProps) {
    const [useGradient, setUseGradient] = useState(() => !hasMediaImage(src));

    useEffect(() => {
        setUseGradient(!hasMediaImage(src));
    }, [src]);

    if (useGradient) {
        return <BrandGradientPlaceholder showBottomOverlay />;
    }

    return (
        <div className="absolute inset-0 overflow-hidden">
            <Image
                src={src!.trim()}
                alt={alt}
                fill
                className={`object-cover ${
                    hoverScale
                        ? "transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04]"
                        : ""
                }`}
                sizes={sizes}
                priority={priority}
                onError={() => setUseGradient(true)}
            />
        </div>
    );
}

export default ProjectCoverImage;

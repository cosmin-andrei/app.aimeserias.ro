"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DEFAULT_USER_AVATAR, getUserAvatar } from "@/lib/media";

type UserAvatarProps = {
    src?: string | null;
    alt: string;
    sizes: string;
    className?: string;
    containerClassName?: string;
    priority?: boolean;
};

export function UserAvatar({
    src,
    alt,
    sizes,
    className = "object-cover",
    containerClassName = "relative h-full w-full overflow-hidden",
    priority,
}: UserAvatarProps) {
    const [avatarSrc, setAvatarSrc] = useState(() => getUserAvatar(src));

    useEffect(() => {
        setAvatarSrc(getUserAvatar(src));
    }, [src]);

    return (
        <div className={containerClassName}>
            <Image
                src={avatarSrc}
                alt={alt}
                fill
                className={className}
                sizes={sizes}
                priority={priority}
                onError={() => {
                    if (avatarSrc !== DEFAULT_USER_AVATAR) {
                        setAvatarSrc(DEFAULT_USER_AVATAR);
                    }
                }}
            />
        </div>
    );
}

export default UserAvatar;

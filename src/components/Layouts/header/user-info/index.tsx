"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useUser } from "@/hooks/useUser";
import { getNavbarQualityLabel } from "@/lib/company-account";
import { getPublicDisplayName } from "@/lib/auth-client";
import { DEFAULT_USER_AVATAR, resolveProfileAvatarUrl } from "@/lib/media";
import { clearAuthToken } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogOutIcon, SettingsIcon } from "./icons";

function AvatarImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [avatarSrc, setAvatarSrc] = useState(src);

  useEffect(() => {
    setAvatarSrc(src);
  }, [src]);

  return (
    <img
      src={avatarSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (avatarSrc !== DEFAULT_USER_AVATAR) {
          setAvatarSrc(DEFAULT_USER_AVATAR);
        }
      }}
    />
  );
}

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useUser();

  const name = getPublicDisplayName(user);
  const email = user?.email ?? "";
  const calitate = getNavbarQualityLabel(user);
  const avatarUrl = useMemo(() => resolveProfileAvatarUrl(user), [user]);

  const handleLogout = () => {
    setIsOpen(false);
    clearAuthToken();
    window.location.href = "/auth/sign-in";
  };

  if (loading) {
    return (
      <AvatarImage
        src={DEFAULT_USER_AVATAR}
        alt="Cont"
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="flex items-center gap-2 rounded-lg px-1.5 py-1 align-middle outline-none transition-colors hover:bg-gray-2 hover:text-dark dark:hover:bg-white/[0.08] dark:hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-[#0A0A0A]">
        <span className="sr-only">Contul meu</span>
        <AvatarImage
          src={avatarUrl}
          alt={name || "Cont"}
          className="size-8 shrink-0 rounded-full object-cover"
        />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-[13px] font-medium leading-tight text-dark dark:text-white">
            {name || "Cont"}
          </span>
          {calitate ? (
            <span className="block truncate text-xs leading-tight text-dark-5 dark:text-[#9CA3AF]">
              {calitate}
            </span>
          ) : null}
        </span>
      </DropdownTrigger>

      <DropdownContent
        className="min-w-[16rem] animate-dropdown-enter rounded-xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#141414]"
        align="end"
      >
        <h2 className="sr-only">Informații cont</h2>

        <figure className="flex items-center gap-3 px-4 py-3">
          <AvatarImage
            src={avatarUrl}
            alt={name || "Cont"}
            className="size-11 shrink-0 rounded-full object-cover"
          />
          <figcaption className="min-w-0 flex-1">
            <div className="truncate font-medium text-dark dark:text-white">{name || "Cont"}</div>
            {calitate ? (
              <div className="truncate text-xs text-[#0060f0] dark:text-[#5b9fff]">{calitate}</div>
            ) : null}
            <div className="truncate text-sm text-dark-5 dark:text-[#9CA3AF]">{email || "—"}</div>
          </figcaption>
        </figure>

        <hr className="border-stroke dark:border-white/[0.06]" />

        <div className="p-1.5 text-sm [&>*]:cursor-pointer">
          <Link
            href={"/setari"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-dark transition-colors hover:bg-gray-2 dark:text-[#E5E7EB] dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <SettingsIcon className="size-4 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
            <span className="font-medium">Setări cont</span>
          </Link>
        </div>

        <hr className="border-stroke dark:border-white/[0.06]" />

        <div className="p-1.5">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium text-red transition-colors hover:bg-red/10 dark:text-red dark:hover:bg-red/15"
            onClick={handleLogout}
          >
            <LogOutIcon className="size-4 shrink-0 text-red" />
            <span>Deconectare</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

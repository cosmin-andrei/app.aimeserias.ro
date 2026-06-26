"use client";

import { PUBLIC_LOGO } from "@/lib/assets";
import Image from "next/image";

export function NavbarLogo() {
  return (
    <div className="flex items-center">
      <Image
        src={PUBLIC_LOGO}
        width={180}
        height={48}
        className="h-7 w-auto object-contain object-left sm:h-8 dark:brightness-0 dark:invert"
        alt="AiMeseriaș"
        quality={100}
        priority
      />
    </div>
  );
}

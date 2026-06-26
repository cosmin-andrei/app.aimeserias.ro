import { PUBLIC_LOGO } from "@/lib/assets";
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={PUBLIC_LOGO}
          fill
          className="object-contain"
          alt="AiMeseriaș"
          quality={100}
          sizes="48px"
        />
      </div>
    </div>
  );
}

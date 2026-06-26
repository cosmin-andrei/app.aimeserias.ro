import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "./icons";

const THEMES = [
  {
    name: "light",
    Icon: Sun,
  },
  {
    name: "dark",
    Icon: Moon,
  },
];

export function ThemeToggleSwitch() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative flex items-center rounded-full border border-[#3b6bb5]/25 bg-[#3b6bb5]/10 p-px text-dark-5 outline-none transition-colors duration-200 hover:border-[#3b6bb5]/35 hover:bg-[#3b6bb5]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6bb5] dark:border-[#5b8fd9]/35 dark:bg-[#5b8fd9]/15 dark:text-[#9CA3AF] dark:hover:border-[#5b8fd9]/45 dark:hover:bg-[#5b8fd9]/20 dark:focus-visible:outline-[#5b8fd9]"
      aria-label={`Comută la modul ${theme === "light" ? "întunecat" : "deschis"}`}
    >
      <span className="sr-only">
        Comută la {theme === "light" ? "dark" : "light"}
      </span>
      {/* Track: două celule, thumb alunecă între ele */}
      <span className="relative flex w-12">
        <span
          className={cn(
            "absolute left-0 top-0 size-6 rounded-full bg-white shadow-sm ring-1 ring-black/[0.06] transition-[transform] duration-300 ease-out dark:bg-white dark:ring-white/20",
            theme === "dark" && "translate-x-6",
          )}
          aria-hidden
        />
        {THEMES.map(({ name, Icon }) => (
          <span
            key={name}
            className={cn(
              "relative z-10 grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-200",
              theme === name
                ? "text-[#2d5ba8] dark:text-[#2d5ba8]"
                : "text-dark-5 hover:text-[#3b6bb5] dark:text-[#6B7280] dark:hover:text-[#5b8fd9]",
            )}
          >
            <Icon className="size-3" />
          </span>
        ))}
      </span>
    </button>
  );
}

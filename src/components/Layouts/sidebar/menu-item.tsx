import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

const menuItemBaseStyles = cva(
  "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-dark-5 dark:text-[#9CA3AF]",
  {
    variants: {
      isActive: {
        true:
          "bg-[#16366d]/15 text-[#16366d] shadow-sm ring-1 ring-[#16366d]/25 hover:bg-[#16366d]/20 hover:text-[#16366d] dark:bg-[#f1f6ff] dark:text-dark dark:ring-[#f1f6ff]/80 dark:hover:bg-[#e8eeff] dark:hover:text-dark",
        false:
          "hover:bg-black/5 hover:text-dark active:bg-black/10 dark:hover:bg-white/[0.05] dark:hover:text-[#E5E7EB] dark:active:bg-white/[0.08]",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
    target?: string;
    rel?: string;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const { target, rel, ...rest } = props;

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        target={target}
        rel={rel}
        // Close sidebar on clicking link if it's mobile
        onClick={() => isMobile && toggleSidebar()}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: "relative",
          }),
          rest.className,
        )}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.isActive}
      className={menuItemBaseStyles({
        isActive: props.isActive,
        className: "flex w-full items-center gap-2 py-2",
      })}
    >
      {props.children}
    </button>
  );
}

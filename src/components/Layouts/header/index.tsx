"use client";

import Link from "next/link";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { ThemeToggleSwitch } from "./theme-toggle";
import { AnnouncementsBell } from "./notification";
import { UserInfo } from "./user-info";
import { NavbarLogo } from "./navbar-logo";

export function Header() {
  const { toggleSidebar, isMobile, isCollapsed, isOpen } = useSidebarContext();
  const sidebarExpanded = isMobile ? isOpen : !isCollapsed;

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between bg-white px-3 shadow-sm dark:bg-[#111111] dark:shadow-none md:px-4 2xl:px-6 3xl:px-10">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex size-8 shrink-0 items-center justify-center self-center rounded-lg text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
          aria-label={sidebarExpanded ? "Restrânge meniul" : "Extinde meniul"}
          aria-expanded={sidebarExpanded}
        >
          {sidebarExpanded ? (
            <PanelLeftClose className="size-4 shrink-0" aria-hidden />
          ) : (
            <PanelLeft className="size-4 shrink-0" aria-hidden />
          )}
        </button>
        <Link href="/" className="inline-flex shrink-0 items-center self-center min-[850px]:min-w-0">
          <NavbarLogo />
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <AnnouncementsBell />
        <ThemeToggleSwitch />
        <UserInfo />
      </div>
    </header>
  );
}

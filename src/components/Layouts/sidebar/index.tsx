"use client";

import { cn } from "@/lib/utils";
import { Footer } from "@/components/Layouts/footer";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { normalizeUserRole } from "@/lib/site";
import { useUser } from "@/hooks/useUser";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getNavData, type NavItem } from "./data";
import { ArrowLeftIcon } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

const SIDEBAR_WIDTH = 200;

function isNavItemActive(pathname: string, searchParams: URLSearchParams, item: NavItem): boolean {
  if (item.external) return false;

  const [path, query] = item.url.split("?");
  if (pathname !== path) return false;

  if (query) {
    const expected = new URLSearchParams(query);
    for (const [key, value] of expected) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  }

  if (path === "/proiecte") {
    const view = searchParams.get("view");
    return view === null || view === "all";
  }

  return searchParams.toString() === "";
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { unreadCount: unreadMessagesCount } = useUnreadMessagesCount();
  const { setIsOpen, isOpen, isMobile, isCollapsed, toggleSidebar } = useSidebarContext();
  const navItems = useMemo(
    () => getNavData(normalizeUserRole(user?.role)),
    [user?.role]
  );

  const desktopExpanded = !isCollapsed;

  return (
    <>
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {isMobile ? (
        <aside
          className={cn(
            "fixed bottom-0 left-0 top-0 z-50 flex flex-col overflow-hidden bg-[#f5f5f7] shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-[#08080a] dark:shadow-black/40",
            isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
          )}
          style={{ width: SIDEBAR_WIDTH }}
          aria-label="Navigare principală"
          aria-hidden={!isOpen}
        >
          <SidebarPanel
            navItems={navItems}
            pathname={pathname}
            searchParams={searchParams}
            onClose={toggleSidebar}
            showMobileClose
            unreadMessagesCount={unreadMessagesCount}
          />
        </aside>
      ) : (
        <aside
          className={cn(
            "sticky top-12 flex h-[calc(100vh-3rem)] shrink-0 flex-col overflow-hidden bg-[#f5f5f7] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-[#08080a]",
            desktopExpanded ? "w-[200px]" : "w-0"
          )}
          aria-label="Navigare principală"
          aria-hidden={!desktopExpanded}
        >
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              desktopExpanded
                ? "translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-2 opacity-0"
            )}
            style={{ width: SIDEBAR_WIDTH }}
          >
            <SidebarPanel
              navItems={navItems}
              pathname={pathname}
              searchParams={searchParams}
              unreadMessagesCount={unreadMessagesCount}
            />
          </div>
        </aside>
      )}
    </>
  );
}

function SidebarPanel({
  navItems,
  pathname,
  searchParams,
  onClose,
  showMobileClose = false,
  unreadMessagesCount = 0,
}: {
  navItems: NavItem[];
  pathname: string;
  searchParams: URLSearchParams;
  onClose?: () => void;
  showMobileClose?: boolean;
  unreadMessagesCount?: number;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showMobileClose && onClose && (
        <div className="flex shrink-0 justify-end border-b border-stroke px-2 py-2 dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-dark-5 transition-colors hover:bg-black/5 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Închide meniul"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
        </div>
      )}

      <nav
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2"
        role="navigation"
        aria-label="Meniu principal"
      >
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, searchParams, item);
            return (
              <li key={item.id}>
                <MenuItem
                  className="flex w-full items-center gap-2 text-sm"
                  as="link"
                  href={item.url}
                  isActive={isActive}
                  {...(item.external && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                >
                  <span className="relative inline-flex shrink-0">
                    <item.icon
                      className={cn(
                        "size-4 transition-colors",
                        isActive ? "text-[#16366d] dark:text-dark" : "text-dark-5 dark:text-[#9CA3AF]"
                      )}
                      aria-hidden="true"
                    />
                    {item.id === "mesaje" && unreadMessagesCount > 0 ? (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0060f0] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[#f5f5f7] dark:bg-[#5b9fff] dark:text-[#08080a] dark:ring-[#08080a]"
                        aria-label={`${unreadMessagesCount} mesaje necitite`}
                      >
                        {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                </MenuItem>
              </li>
            );
          })}
        </ul>
      </nav>

      <Footer />
    </div>
  );
}

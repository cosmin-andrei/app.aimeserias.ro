"use client";

import {
    Dropdown,
    DropdownContent,
    DropdownTrigger,
} from "@/components/ui/dropdown";
import { useUser } from "@/hooks/useUser";
import { getAnnouncements, type Announcement } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function AnnouncementsBell() {
    const { user, loading } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    const loadAnnouncements = useCallback(async () => {
        setLoadingList(true);
        const { announcements: list } = await getAnnouncements();
        setAnnouncements(list ?? []);
        setLoadingList(false);
        return list ?? [];
    }, []);

    useEffect(() => {
        if (!user || loading) return;

        void loadAnnouncements().then((list) => {
            if (list.length > 0) {
                const lastSeen = localStorage.getItem("announcements_last_seen_count");
                const seenCount = lastSeen ? parseInt(lastSeen, 10) : 0;
                setHasUnread(list.length > seenCount);
            }
        });
    }, [user, loading, loadAnnouncements]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            void loadAnnouncements().then((list) => {
                localStorage.setItem("announcements_last_seen_count", String(list.length));
                setHasUnread(false);
            });
        }
    };

    if (!user || loading) {
        return null;
    }

    const count = announcements.length;

    return (
        <Dropdown isOpen={isOpen} setIsOpen={handleOpenChange}>
            <DropdownTrigger
                className={cn(
                    "relative inline-flex size-8 items-center justify-center rounded-lg text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white",
                    isOpen && "bg-gray-2 text-dark dark:bg-white/[0.06] dark:text-white"
                )}
                aria-label="Anunțuri"
            >
                <Bell
                    className={cn(
                        "size-4 transition-transform duration-300 ease-out",
                        isOpen && "rotate-12 scale-110"
                    )}
                    aria-hidden
                />
                {hasUnread && count > 0 && (
                    <span className="absolute right-1 top-1 flex size-2 rounded-full bg-red ring-2 ring-white dark:ring-[#111111]">
                        <span className="absolute inset-0 animate-ping rounded-full bg-red opacity-75" />
                    </span>
                )}
                {count > 0 && (
                    <span className="sr-only">
                        {count} {count === 1 ? "anunț activ" : "anunțuri active"}
                    </span>
                )}
            </DropdownTrigger>

            <DropdownContent
                align="end"
                className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-stroke bg-white p-2 shadow-xl dark:border-white/[0.08] dark:bg-[#1a1a1c]"
            >
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <span className="text-sm font-semibold text-dark dark:text-white">Anunțuri</span>
                    {count > 0 && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                            {count} {count === 1 ? "activ" : "active"}
                        </span>
                    )}
                </div>

                <ul className="custom-scrollbar max-h-[min(20rem,60vh)] space-y-1 overflow-y-auto px-1 pb-1">
                    {loadingList ? (
                        <li className="rounded-lg px-3 py-3 text-sm text-dark-5 dark:text-[#9CA3AF]">
                            Se încarcă…
                        </li>
                    ) : count === 0 ? (
                        <li className="rounded-lg px-3 py-3 text-sm text-dark-5 dark:text-[#9CA3AF]">
                            Nu există anunțuri active.
                        </li>
                    ) : (
                        announcements.map((ann) => (
                            <li
                                key={ann.id}
                                className="rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:bg-gray-1 dark:hover:bg-white/[0.04]"
                            >
                                <p className="text-sm font-medium text-dark dark:text-white">{ann.title}</p>
                                {ann.category ? (
                                    <p className="mt-0.5 text-[11px] font-medium text-dark-5 dark:text-[#9CA3AF]">
                                        {ann.category}
                                    </p>
                                ) : null}
                                {ann.content ? (
                                    <p className="mt-1 text-xs leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                                        {ann.content}
                                    </p>
                                ) : null}
                                <p className="mt-1.5 text-[10px] text-dark-5 dark:text-[#6B7280]">
                                    {ann.createdBy} · {ann.createdAt}
                                </p>
                            </li>
                        ))
                    )}
                </ul>
            </DropdownContent>
        </Dropdown>
    );
}

// Compatibilitate cu importuri vechi
export const Notification = AnnouncementsBell;

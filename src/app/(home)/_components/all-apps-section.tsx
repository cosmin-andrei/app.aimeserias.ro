"use client";

import { LayoutGrid, Star } from "lucide-react";
import Link from "next/link";
import { ALL_APPS } from "./apps-data";
import { useFavoriteApps } from "./favorite-apps-context";

export function AllAppsSection() {
  const { favoriteIds, toggleFavorite } = useFavoriteApps();
  const nonFavoriteApps = ALL_APPS.filter((app) => !favoriteIds.includes(app.id));

  return (
    <section className="rounded-2xl bg-white/60 p-6 ring-1 ring-black/[0.04] dark:bg-white/[0.02] dark:ring-white/[0.06] sm:p-8">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#16366d]/10 text-[#16366d] dark:bg-[#f1f6ff]/20 dark:text-[#f1f6ff]">
          <LayoutGrid className="size-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-dark dark:text-white">
            Toate aplicațiile
          </h2>
        </div>
        <span className="rounded-full bg-[#16366d]/10 px-4 py-2 text-sm font-semibold tabular-nums text-[#16366d] dark:bg-[#f1f6ff]/20 dark:text-[#f1f6ff]">
          {nonFavoriteApps.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {nonFavoriteApps.map((app) => (
          <div
            key={app.id}
            className="group flex items-center gap-3 rounded-xl border border-transparent bg-white py-3 pl-3 pr-3 shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md hover:ring-[#16366d]/20 dark:bg-[#141414] dark:ring-white/[0.06] dark:hover:shadow-lg dark:hover:ring-[#f1f6ff]/20"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#16366d]/10 text-sm font-bold text-[#16366d] dark:bg-[#f1f6ff]/15 dark:text-[#f1f6ff]">
              {app.initial}
            </div>
            <Link
              href={app.externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16366d] dark:focus-visible:outline-[#f1f6ff]"
            >
              <h3 className="font-semibold text-dark dark:text-white break-words text-sm leading-tight">{app.title}</h3>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                {app.description}
              </p>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(app.id);
              }}
              className="shrink-0 rounded p-1.5 text-dark-5 transition-colors hover:bg-amber-500/10 hover:text-amber-500 dark:text-[#9CA3AF] dark:hover:bg-amber-400/10 dark:hover:text-amber-400"
              aria-label="Adaugă la favorite"
            >
              <Star className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

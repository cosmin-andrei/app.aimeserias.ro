"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ALL_APPS, type AppItem } from "./apps-data";
import { useFavoriteApps } from "./favorite-apps-context";

export function FavoriteAppsSection() {
  const { favoriteIds, toggleFavorite, reorderFavorites } = useFavoriteApps();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragImageRef = useRef<HTMLElement | null>(null);

  const favoriteApps = favoriteIds
    .map((id) => ALL_APPS.find((a) => a.id === id))
    .filter((a): a is AppItem => a != null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      setDropTargetIndex(null);
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";

      // Imagine de drag = întregul card (cadranul), nu doar textul
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const clone = card.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = `${rect.width}px`;
      clone.style.minWidth = `${rect.width}px`;
      clone.style.opacity = "0.92";
      clone.style.pointerEvents = "none";
      clone.style.zIndex = "9999";
      clone.style.boxShadow = "0 25px 50px -12px rgba(0,0,0,0.25)";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
      dragImageRef.current = clone;

      // Cursor grabbing evident pe tot ecranul în timpul tragerii
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTargetIndex(null);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (dragImageRef.current?.parentNode) {
      dragImageRef.current.remove();
      dragImageRef.current = null;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      setDropTargetIndex(null);
      const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) return;
      const newOrder = [...favoriteApps.map((a) => a.id)];
      const [removed] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, removed);
      reorderFavorites(newOrder);
      setDraggedIndex(null);
    },
    [favoriteApps, reorderFavorites],
  );

  if (favoriteApps.length === 0) {
    return (
      <section className="rounded-2xl bg-white/60 p-6 ring-1 ring-black/[0.04] dark:bg-white/[0.02] dark:ring-white/[0.06] sm:p-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            <Star className="size-6" strokeWidth={1.75} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-dark dark:text-white">
              Aplicații favorite
            </h2>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-stroke/60 bg-white/50 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <Star className="mx-auto size-10 text-dark-5/50 dark:text-[#9CA3AF]/50" strokeWidth={1} />
          <p className="mt-3 text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
            Nicio aplicație favorită
          </p>
          <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
            Apasă steaua pe o aplicație din „Toate aplicațiile” pentru a o adăuga aici
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white/60 p-6 ring-1 ring-black/[0.04] dark:bg-white/[0.02] dark:ring-white/[0.06] sm:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
          <Star className="size-6" strokeWidth={1.75} fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-dark dark:text-white">
            Aplicații favorite
          </h2>
          {isReorderMode && (
            <p className="mt-1 text-sm text-dark-5 dark:text-[#9CA3AF]">
              Trage un card în poziția dorită.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReorderMode((v) => !v)}
            className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
          >
            {isReorderMode ? "Finalizează" : "Editează ordinea"}
          </button>
          <span className="rounded-full bg-amber-500/10 px-4 py-2 text-sm font-semibold tabular-nums text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            {favoriteApps.length}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favoriteApps.map((app, index) => (
          <div
            key={app.id}
            draggable={isReorderMode}
            onDragStart={isReorderMode ? (e) => handleDragStart(e, index) : undefined}
            onDragEnd={isReorderMode ? handleDragEnd : undefined}
            onDragOver={isReorderMode ? (e) => handleDragOver(e, index) : undefined}
            onDragLeave={isReorderMode ? handleDragLeave : undefined}
            onDrop={isReorderMode ? (e) => handleDrop(e, index) : undefined}
            className={`group flex items-center gap-3 rounded-xl border bg-white py-3 pl-3 pr-3 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 ease-out dark:bg-[#141414] dark:ring-white/[0.06] ${
              isReorderMode ? "cursor-grab touch-none select-none active:cursor-grabbing" : "hover:-translate-y-0.5 hover:shadow-md hover:ring-amber-500/20 dark:hover:ring-amber-400/20"
            } ${
              draggedIndex === index
                ? "scale-95 opacity-70 border-amber-500 ring-2 ring-amber-500/60 shadow-lg dark:border-amber-400 dark:ring-amber-400/60"
                : "border-transparent"
            } ${
              dropTargetIndex === index && draggedIndex !== index
                ? "border-t-4 border-t-amber-500 border-t-dashed bg-amber-500/5 dark:border-t-amber-400 dark:bg-amber-500/10"
                : ""
            }`}
            aria-label={isReorderMode ? "Trage cardul pentru a schimba ordinea" : undefined}
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
              className="shrink-0 rounded p-1.5 text-amber-500 transition-colors hover:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-400/10"
              aria-label="Elimină din favorite"
            >
              <Star className="size-4" strokeWidth={1.5} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

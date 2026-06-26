"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ALL_APPS, FAVORITE_APP_IDS } from "./apps-data";

const STORAGE_KEY = "contulmeu-favorite-app-ids";

type FavoriteAppsContextValue = {
  favoriteIds: string[];
  toggleFavorite: (appId: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
  isFavorite: (appId: string) => boolean;
};

const FavoriteAppsContext = createContext<FavoriteAppsContextValue | null>(null);

function loadFromStorage(): string[] {
  if (typeof window === "undefined") return FAVORITE_APP_IDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FAVORITE_APP_IDS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return FAVORITE_APP_IDS;
    const valid = ALL_APPS.map((a) => a.id);
    return parsed.filter((id): id is string => typeof id === "string" && valid.includes(id));
  } catch {
    return FAVORITE_APP_IDS;
  }
}

function saveToStorage(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function FavoriteAppsProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(FAVORITE_APP_IDS);

  useEffect(() => {
    setFavoriteIds(loadFromStorage());
  }, []);

  const toggleFavorite = useCallback((appId: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
      saveToStorage(next);
      return next;
    });
  }, []);

  const reorderFavorites = useCallback((newOrder: string[]) => {
    setFavoriteIds((prev) => {
      const next = newOrder.filter((id) => prev.includes(id));
      const rest = prev.filter((id) => !newOrder.includes(id));
      const result = [...next, ...rest];
      saveToStorage(result);
      return result;
    });
  }, []);

  const isFavorite = useCallback(
    (appId: string) => favoriteIds.includes(appId),
    [favoriteIds],
  );

  return (
    <FavoriteAppsContext.Provider value={{ favoriteIds, toggleFavorite, reorderFavorites, isFavorite }}>
      {children}
    </FavoriteAppsContext.Provider>
  );
}

export function useFavoriteApps() {
  const ctx = useContext(FavoriteAppsContext);
  if (!ctx) throw new Error("useFavoriteApps must be used within FavoriteAppsProvider");
  return ctx;
}

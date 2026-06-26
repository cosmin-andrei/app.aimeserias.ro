"use client";

import { useContext } from "react";
import { UserContext } from "@/contexts/UserContext";

export function useUser() {
  return useContext(UserContext);
}

/** Inițiale din nume (ex. "Ion Popescu" -> "IP") */
export function getInitials(name: string | undefined): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

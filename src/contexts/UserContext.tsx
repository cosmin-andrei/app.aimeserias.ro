"use client";

import { appUserToProfile, fetchCurrentUser } from "@/lib/api-client";
import { getAuthToken, handleSessionExpired, isAuthTokenValid, setAuthToken } from "@/lib/auth";
import type { SsoProfile } from "@/lib/auth-client";
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserContextValue = {
  user: SsoProfile | null;
  loading: boolean;
  refetch: () => Promise<void>;
  loginAndLoadUser: (token: string) => Promise<void>;
};

const defaultValue: UserContextValue = {
  user: null,
  loading: true,
  refetch: async () => {},
  loginAndLoadUser: async () => {},
};

export const UserContext = createContext<UserContextValue>(defaultValue);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SsoProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (typeof window === "undefined" || !getAuthToken() || !isAuthTokenValid()) return;
    const appUser = await fetchCurrentUser();
    setUser(appUser ? appUserToProfile(appUser) : null);
  }, []);

  const loginAndLoadUser = useCallback(async (token: string) => {
    setAuthToken(token);
    setLoading(true);
    try {
      const appUser = await fetchCurrentUser();
      setUser(appUser ? appUserToProfile(appUser) : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (!isAuthTokenValid()) {
      handleSessionExpired();
      return;
    }
    let cancelled = false;
    fetchCurrentUser()
      .then((appUser) => {
        if (!cancelled) setUser(appUser ? appUserToProfile(appUser) : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refetch, loginAndLoadUser }}>
      {children}
    </UserContext.Provider>
  );
}

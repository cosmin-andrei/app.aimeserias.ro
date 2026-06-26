"use client";

import { useUser } from "@/hooks/useUser";
import { getTotalUnreadCount, listConversations } from "@/lib/messaging";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type PropsWithChildren,
} from "react";

const POLL_MS = 1500;

type UnreadMessagesContextValue = {
    unreadCount: number;
    loading: boolean;
    refresh: () => Promise<void>;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(null);

export function UnreadMessagesProvider({ children }: PropsWithChildren) {
    const { user, loading: userLoading } = useUser();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const { data } = await listConversations();
        setUnreadCount(getTotalUnreadCount(data ?? []));
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (userLoading) return;
        void refresh();
    }, [userLoading, refresh]);

    useEffect(() => {
        if (!user) return;

        const poll = () => {
            if (document.visibilityState === "visible") {
                void refresh();
            }
        };

        poll();
        const interval = window.setInterval(poll, POLL_MS);
        document.addEventListener("visibilitychange", poll);
        window.addEventListener("focus", poll);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", poll);
            window.removeEventListener("focus", poll);
        };
    }, [user, refresh]);

    const value: UnreadMessagesContextValue = {
        unreadCount,
        loading: loading || userLoading,
        refresh,
    };

    return (
        <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>
    );
}

export function useUnreadMessagesCount() {
    const context = useContext(UnreadMessagesContext);
    if (!context) {
        throw new Error("useUnreadMessagesCount must be used within UnreadMessagesProvider");
    }
    return context;
}

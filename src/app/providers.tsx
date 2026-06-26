"use client";

import { ToastProvider } from "@/contexts/ToastContext";
import { UnreadMessagesProvider } from "@/contexts/UnreadMessagesContext";
import { UserProvider } from "@/contexts/UserContext";
import { VoiceCallProvider } from "@/contexts/VoiceCallContext";
import { VoiceCallOverlay } from "@/components/voice-call/VoiceCallOverlay";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <UserProvider>
        <UnreadMessagesProvider>
        <VoiceCallProvider>
          <ToastProvider>
            <SidebarProvider>
              {children}
              <VoiceCallOverlay />
            </SidebarProvider>
          </ToastProvider>
        </VoiceCallProvider>
        </UnreadMessagesProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

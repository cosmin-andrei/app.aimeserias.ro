import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { AppShell } from "@/components/Layouts/app-shell";
import { PUBLIC_FAVICON } from "@/lib/assets";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Meserias",
    default: "Meserias",
  },
  description: "Platforma Meserias – autentificare și cont.",
  icons: {
    icon: [{ url: PUBLIC_FAVICON, type: "image/png" }],
    shortcut: PUBLIC_FAVICON,
    apple: PUBLIC_FAVICON,
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

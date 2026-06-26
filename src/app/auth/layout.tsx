import { AuthFooter } from "@/components/Auth/AuthFooter";
import { Roboto } from "next/font/google";
import type { PropsWithChildren } from "react";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div
      className={`${roboto.className} flex min-h-screen flex-col bg-[#202124] text-[#e8eaed]`}
    >
      <main className="box-border flex flex-1 items-center justify-center p-5">
        {children}
      </main>
      <AuthFooter />
    </div>
  );
}

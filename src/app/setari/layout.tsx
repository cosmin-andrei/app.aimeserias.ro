import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setări cont",
};

export default function SetariLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

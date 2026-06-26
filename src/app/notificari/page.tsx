import Link from "next/link";

export default function NotificariPage() {
  return (
    <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-stroke dark:bg-[#1F1F1F] dark:ring-white/[0.06]">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Notificări</h1>
      <p className="mt-2 text-dark-5 dark:text-[#9CA3AF]">
        Notificare activă: 1. Vezi toate notificările.
      </p>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
        ← Înapoi la Dashboard
      </Link>
    </div>
  );
}

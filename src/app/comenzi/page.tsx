"use client";

import { Package } from "lucide-react";

export default function ComenziPage() {
  return (
    <div className="w-full">
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-stroke dark:bg-[#1A1A1A] dark:ring-white/[0.08]">
        <div className="border-b border-stroke px-6 py-5 dark:border-white/[0.08]">
          <h1 className="text-xl font-semibold tracking-tight text-dark dark:text-white sm:text-2xl">
            Comenzile mele
          </h1>
        </div>

        <div className="p-6">
          <div className="mb-6 flex flex-1 items-center gap-4 rounded-xl border border-stroke bg-gray-2/50 p-6 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue/25 text-blue-500 dark:bg-blue/35 dark:text-blue-400">
              <Package className="size-6" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                Total comenzi
              </p>
              <p className="mt-0.5 text-2xl font-semibold text-dark dark:text-white">
                0
              </p>
            </div>
          </div>

          <p className="text-dark-5 dark:text-[#9CA3AF]">
            Această funcționalitate va fi implementată în curând. Vei putea gestiona aici comenzile tale.
          </p>
        </div>
      </div>
    </div>
  );
}

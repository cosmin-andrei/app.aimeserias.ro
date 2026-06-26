"use client";

import { ArrowLeftRight, ChevronRight, Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";

const MOCK_REDIRECTS = [
  {
    id: "1",
    source: "3% din impozit",
    destination: "Asociația ONedu",
    fiscalYear: "2026",
    completionDate: "10 ianuarie 2026",
    status: "Activă",
    sendMethod: "Online",
    amount: "3%",
  },
  {
    id: "2",
    source: "2% din impozit",
    destination: "Proiect Educație Digitală",
    fiscalYear: "2025",
    completionDate: "5 decembrie 2025",
    status: "Activă",
    sendMethod: "Online",
    amount: "2%",
  },
];

const STATUS_OPTIONS = ["Toate", "Efectuată", "În așteptare", "Anulată"];

type Redirect = (typeof MOCK_REDIRECTS)[number];

export default function RedirectionariPage() {
  const [detailRedirect, setDetailRedirect] = useState<Redirect | null>(null);
  const [statusFilter, setStatusFilter] = useState("Toate");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return MOCK_REDIRECTS.filter((r) => {
      const matchStatus = statusFilter === "Toate" || r.status === statusFilter;
      const matchSearch =
        !search.trim() ||
        r.fiscalYear.includes(search) ||
        r.completionDate.toLowerCase().includes(search.toLowerCase()) ||
        r.sendMethod.toLowerCase().includes(search.toLowerCase()) ||
        r.amount.includes(search);
      return matchStatus && matchSearch;
    });
  }, [statusFilter, search]);

  return (
    <div className="w-full">
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-stroke dark:bg-[#1A1A1A] dark:ring-white/[0.08]">
        <div className="border-b border-stroke px-6 py-5 dark:border-white/[0.08]">
          <h1 className="text-xl font-semibold tracking-tight text-dark dark:text-white sm:text-2xl">
            Redirecționările mele
          </h1>
        </div>

        <div className="p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="flex flex-1 items-center gap-4 rounded-xl border border-stroke bg-gray-2/50 p-6 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue/25 text-blue-500 dark:bg-blue/35 dark:text-blue-400">
                <ArrowLeftRight className="size-6" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Redirecționări efectuate
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-dark dark:text-white">
                  {MOCK_REDIRECTS.length}
                </p>
              </div>
            </div>
            <a
              href="https://onedu.ro/formular230"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stroke bg-white px-6 py-3 text-sm font-medium text-dark transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
            >
              Redirecționează 3.5%
              <ChevronRight className="size-4" strokeWidth={2} />
            </a>
          </div>

          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Istoric redirecționări
          </h2>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-5 dark:text-[#9CA3AF]" />
              <input
                type="search"
                placeholder="Caută..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-stroke bg-gray-2 py-2.5 pl-10 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#16366d] focus:ring-1 focus:ring-[#16366d] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-[#9CA3AF] dark:focus:border-[#16366d] dark:focus:ring-[#16366d]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-stroke bg-gray-2 px-4 py-2.5 pr-9 text-sm text-dark outline-none focus:border-[#16366d] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              aria-label="Status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-white/[0.08]">
            <table className="w-full min-w-[560px] text-center text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/80 dark:border-white/[0.08] dark:bg-white/[0.03]">
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Anul fiscal
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Data completării
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Status
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Metodă
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Sumă
                  </th>
                  <th className="w-28 px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Detalii
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-stroke last:border-b-0 hover:bg-gray-2/50 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3.5 font-medium text-dark dark:text-white">
                      {r.fiscalYear}
                    </td>
                    <td className="px-4 py-3.5 text-dark-5 dark:text-[#9CA3AF]">
                      {r.completionDate}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-dark dark:text-white">{r.sendMethod}</td>
                    <td className="px-4 py-3.5 font-medium text-dark dark:text-white">
                      {r.amount}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setDetailRedirect(r)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-dark-5 transition-colors hover:text-[#16366d] dark:text-[#9CA3AF] dark:hover:text-white"
                      >
                        <Eye className="size-4 shrink-0" strokeWidth={2} />
                        Vezi detalii
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Popup detalii redirecționare */}
      {detailRedirect && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70"
            aria-hidden
            onClick={() => setDetailRedirect(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="redirect-detail-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] mx-4"
          >
            <h2 id="redirect-detail-title" className="text-lg font-semibold text-dark dark:text-white">
              Detalii redirecționare
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Anul fiscal</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailRedirect.fiscalYear}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Data completării</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailRedirect.completionDate}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Sursă</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailRedirect.source}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Destinație</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailRedirect.destination}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Sumă</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailRedirect.amount}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Metodă</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailRedirect.sendMethod}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Status</dt>
                <dd className="mt-0.5">
                  <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    {detailRedirect.status}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailRedirect(null)}
                className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
              >
                Închide
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

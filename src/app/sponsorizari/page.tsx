"use client";

import { ChevronRight, Eye, HeartHandshake, Search } from "lucide-react";
import { useMemo, useState } from "react";

const MOCK_SPONSORSHIPS = [
  {
    id: "1",
    contractNumber: "SP-2026-001",
    date: "15 ianuarie 2026",
    amount: 500,
    status: "Activă",
    cause: "Sponsorizare educație",
    companyName: "Liceul Teoretic Nr. 1",
  },
  {
    id: "2",
    contractNumber: "SP-2025-042",
    date: "1 septembrie 2025",
    amount: 300,
    status: "Activă",
    cause: "Proiect digital",
    companyName: "Asociația ONedu",
  },
];

const STATUS_OPTIONS = ["Toate", "Activă", "În așteptare", "Anulată"];

type Sponsorship = (typeof MOCK_SPONSORSHIPS)[number];

export default function SponsorizariPage() {
  const [detailSponsorship, setDetailSponsorship] = useState<Sponsorship | null>(null);
  const [statusFilter, setStatusFilter] = useState("Toate");
  const [search, setSearch] = useState("");
  const total = MOCK_SPONSORSHIPS.reduce((s, sp) => s + sp.amount, 0);

  const filtered = useMemo(() => {
    return MOCK_SPONSORSHIPS.filter((sp) => {
      const matchStatus = statusFilter === "Toate" || sp.status === statusFilter;
      const matchSearch =
        !search.trim() ||
        sp.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        sp.date.toLowerCase().includes(search.toLowerCase()) ||
        sp.companyName.toLowerCase().includes(search.toLowerCase()) ||
        sp.cause.toLowerCase().includes(search.toLowerCase()) ||
        String(sp.amount).includes(search);
      return matchStatus && matchSearch;
    });
  }, [statusFilter, search]);

  return (
    <div className="w-full">
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-stroke dark:bg-[#1A1A1A] dark:ring-white/[0.08]">
        <div className="border-b border-stroke px-6 py-5 dark:border-white/[0.08]">
          <h1 className="text-xl font-semibold tracking-tight text-dark dark:text-white sm:text-2xl">
            Sponsorizările mele
          </h1>
        </div>

        <div className="p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="flex flex-1 items-center gap-4 rounded-xl border border-stroke bg-gray-2/50 p-6 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/25 text-amber-600 dark:bg-amber-400/35 dark:text-amber-400">
                <HeartHandshake className="size-6" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Total sponsorizat
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-dark dark:text-white">
                  {total} RON
                </p>
              </div>
            </div>
            <a
              href="https://onedu.ro/contract"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stroke bg-white px-6 py-3 text-sm font-medium text-dark transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
            >
              Completează contract
              <ChevronRight className="size-4" strokeWidth={2} />
            </a>
          </div>

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
            <table className="w-full min-w-[640px] text-center text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/80 dark:border-white/[0.08] dark:bg-white/[0.03]">
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Număr contract
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Dată
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Nume companie
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Cauză
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Valoare
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Status
                  </th>
                  <th className="w-28 px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Detalii
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sp) => (
                  <tr
                    key={sp.id}
                    className="border-b border-stroke last:border-b-0 hover:bg-gray-2/50 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3.5 font-medium text-dark dark:text-white">
                      {sp.contractNumber}
                    </td>
                    <td className="px-4 py-3.5 text-dark-5 dark:text-[#9CA3AF]">{sp.date}</td>
                    <td className="px-4 py-3.5 text-dark dark:text-white">{sp.companyName}</td>
                    <td className="px-4 py-3.5 text-dark dark:text-white">{sp.cause}</td>
                    <td className="px-4 py-3.5 font-medium text-dark dark:text-white">
                      {sp.amount} RON
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                        {sp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setDetailSponsorship(sp)}
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

      {/* Popup detalii sponsorizare */}
      {detailSponsorship && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70"
            aria-hidden
            onClick={() => setDetailSponsorship(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sponsorship-detail-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] mx-4"
          >
            <h2 id="sponsorship-detail-title" className="text-lg font-semibold text-dark dark:text-white">
              Detalii sponsorizare
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Număr contract</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailSponsorship.contractNumber}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Dată</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailSponsorship.date}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Valoare</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailSponsorship.amount} RON</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Status</dt>
                <dd className="mt-0.5">
                  <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    {detailSponsorship.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Cauză</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailSponsorship.cause}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Nume companie</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailSponsorship.companyName}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailSponsorship(null)}
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

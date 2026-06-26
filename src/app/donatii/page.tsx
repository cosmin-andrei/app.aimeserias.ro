"use client";

import { ChevronRight, Eye, Heart, Search } from "lucide-react";
import { useMemo, useState } from "react";

const MOCK_DONATIONS = [
  { id: "1", date: "15 ianuarie 2026", amount: 150, cause: "Fond ONedu - Educație", status: "Efectuată", paymentMethod: "Card bancar" },
  { id: "2", date: "3 decembrie 2025", amount: 100, cause: "Campanie BETA", status: "Efectuată", paymentMethod: "Transfer" },
  { id: "3", date: "20 noiembrie 2025", amount: 150, cause: "Fond ONedu - Educație", status: "Efectuată", paymentMethod: "Card bancar" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "Toate", label: "Toate statusurile" },
  { value: "Efectuată", label: "Efectuată" },
  { value: "În așteptare", label: "În așteptare" },
  { value: "Anulată", label: "Anulată" },
];
const PAYMENT_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "Toate", label: "Toate metodele" },
  { value: "Card bancar", label: "Card bancar" },
  { value: "Transfer", label: "Transfer" },
];

export default function DonatiiPage() {
  const [statusFilter, setStatusFilter] = useState("Toate");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("Toate");
  const [search, setSearch] = useState("");
  const [detailDonation, setDetailDonation] = useState<typeof MOCK_DONATIONS[0] | null>(null);

  const total = MOCK_DONATIONS.reduce((s, d) => s + d.amount, 0);

  const filtered = useMemo(() => {
    return MOCK_DONATIONS.filter((d) => {
      const matchStatus = statusFilter === "Toate" || d.status === statusFilter;
      const matchPaymentMethod =
        paymentMethodFilter === "Toate" || d.paymentMethod === paymentMethodFilter;
      const matchSearch =
        !search.trim() ||
        d.date.toLowerCase().includes(search.toLowerCase()) ||
        String(d.amount).includes(search) ||
        d.paymentMethod.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchPaymentMethod && matchSearch;
    });
  }, [statusFilter, paymentMethodFilter, search]);

  return (
    <div className="w-full">
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-stroke dark:bg-[#1A1A1A] dark:ring-white/[0.08]">
        <div className="border-b border-stroke px-6 py-5 dark:border-white/[0.08]">
          <h1 className="text-xl font-semibold tracking-tight text-dark dark:text-white sm:text-2xl">
            Donațiile mele
          </h1>
        </div>

        <div className="p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="flex flex-1 items-center gap-4 rounded-xl border border-stroke bg-gray-2/50 p-6 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="flex size-12 items-center justify-center rounded-full bg-red/25 text-red-500 dark:bg-red/35 dark:text-red-400">
                <Heart className="size-6" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Suma totală donată
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-dark dark:text-white">
                  {total} RON
                </p>
              </div>
            </div>
            <a
              href="https://onedu.ro/doneaza"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stroke bg-white px-6 py-3 text-sm font-medium text-dark transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
            >
              Donează
              <ChevronRight className="size-4" strokeWidth={2} />
            </a>
          </div>

          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Istoric donații
          </h2>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-5 dark:text-[#9CA3AF]" />
                <input
                  id="donatii-search"
                  type="search"
                  placeholder="Caută..."
                  aria-label="Caută"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-stroke bg-gray-2 py-2.5 pl-10 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#16366d] focus:ring-1 focus:ring-[#16366d] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-[#9CA3AF] dark:focus:border-[#16366d] dark:focus:ring-[#16366d]"
                />
              </div>
            </div>
            <div>
              <select
                id="donatii-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-stroke bg-gray-2 px-4 py-2.5 pr-9 text-sm text-dark outline-none focus:border-[#16366d] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white min-w-[160px]"
                aria-label="Filtrează după status donație"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                id="donatii-method"
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="rounded-xl border border-stroke bg-gray-2 px-4 py-2.5 pr-9 text-sm text-dark outline-none focus:border-[#16366d] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white min-w-[160px]"
                aria-label="Filtrează după metodă de plată"
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-white/[0.08]">
            <table className="w-full min-w-[500px] text-center text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/80 dark:border-white/[0.08] dark:bg-white/[0.03]">
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Dată
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Sumă
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Metoda de plată
                  </th>
                  <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Status
                  </th>
                  <th className="w-24 px-4 py-3.5 font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
                    Detalii
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-stroke last:border-b-0 hover:bg-gray-2/50 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3.5 text-dark-5 dark:text-[#9CA3AF]">{d.date}</td>
                    <td className="px-4 py-3.5 font-medium text-dark dark:text-white">
                      {d.amount} RON
                    </td>
                    <td className="px-4 py-3.5 text-dark dark:text-white">{d.paymentMethod}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setDetailDonation(d)}
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

      {/* Popup detalii donație */}
      {detailDonation && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70"
            aria-hidden
            onClick={() => setDetailDonation(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-detail-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] mx-4"
          >
            <h2 id="donation-detail-title" className="text-lg font-semibold text-dark dark:text-white">
              Detalii donație
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Dată</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailDonation.date}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Sumă</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailDonation.amount} RON</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Metoda de plată</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailDonation.paymentMethod}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Cauză</dt>
                <dd className="mt-0.5 text-dark dark:text-white">{detailDonation.cause}</dd>
              </div>
              <div>
                <dt className="font-medium text-dark-5 dark:text-[#9CA3AF]">Status</dt>
                <dd className="mt-0.5">
                  <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    {detailDonation.status}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailDonation(null)}
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

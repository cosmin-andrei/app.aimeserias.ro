"use client";

import { ProjectCoverImage } from "@/components/ProjectCoverImage";
import { ClientProfile } from "@/app/proiecte/ClientProfile";
import { deleteCalendarEvent } from "@/lib/api-client";
import {
  CALENDAR_EVENT_TYPE_LABELS,
  formatDayHeading,
  formatTimeRange,
  getCalendarEventDetail,
  getStatusStyle,
  type CalendarEvent,
} from "@/lib/worker-calendar";
import { Briefcase, Calendar, Clock, MapPin, Package, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CalendarEventDetailPopupProps = {
  event: CalendarEvent | null;
  closing: boolean;
  entered: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDeleted?: () => void;
};

export function CalendarEventDetailPopup({
  event,
  closing,
  entered,
  onClose,
  onEdit,
  onDeleted,
}: CalendarEventDetailPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!event) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [event, onClose]);

  if (!mounted || !event || typeof document === "undefined") return null;

  const { event: detail, project } = getCalendarEventDetail(event);
  const title = project?.title ?? detail.title;
  const description = project?.excerpt ?? detail.description;
  const location = project?.location ?? detail.location;
  const category = project?.category ?? detail.category;
  const budget = project?.budget ?? detail.budgetLabel;
  const status = project?.status ?? detail.status;
  const materials = detail.materials;
  const eventDate = new Date(`${detail.date}T12:00:00`);
  const canEdit = detail.isCustom && detail.customEventId;

  const handleDelete = async () => {
    if (!detail.customEventId) return;
    if (!window.confirm("Ștergi această lucrare din calendar?")) return;
    setDeleting(true);
    setDeleteError(null);
    const { success, error } = await deleteCalendarEvent(detail.customEventId);
    setDeleting(false);
    if (!success) {
      setDeleteError(error || "Nu am putut șterge evenimentul.");
      return;
    }
    onDeleted?.();
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[130] bg-black/50 backdrop-blur-md ${
          closing ? "animate-backdrop-exit" : entered ? "animate-backdrop-enter" : "opacity-0"
        }`}
        aria-hidden
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-[140] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-detail-title"
          className={`pointer-events-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1A1A1A] dark:ring-1 dark:ring-white/[0.08] ${
            closing ? "animate-modal-exit" : entered ? "animate-modal-enter" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-stroke/80 px-5 py-4 dark:border-white/[0.08]">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-dark-5 dark:text-[#9CA3AF]">
                {CALENDAR_EVENT_TYPE_LABELS[detail.type]}
              </p>
              <h2
                id="event-detail-title"
                className="mt-0.5 truncate text-lg font-semibold tracking-tight text-dark dark:text-white"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Închide"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto">
            {project?.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#002050]/5">
                <ProjectCoverImage
                  src={project.image}
                  alt={title}
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
            )}

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                {category && (
                  <span className="rounded-full bg-[#16366d]/10 px-3 py-1 text-xs font-semibold text-[#16366d] dark:bg-[#f1f6ff]/15 dark:text-[#f1f6ff]">
                    {category}
                  </span>
                )}
                {status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusStyle(status)}`}
                  >
                    {status}
                  </span>
                )}
                {detail.isCustom && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Adăugat de tine
                  </span>
                )}
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-2/70 px-4 py-3 dark:bg-white/[0.04]">
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                    <Calendar className="size-3.5" aria-hidden />
                    Data
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-dark dark:text-white">
                    {formatDayHeading(eventDate)}
                  </dd>
                </div>

                <div className="rounded-xl bg-gray-2/70 px-4 py-3 dark:bg-white/[0.04]">
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                    <Clock className="size-3.5" aria-hidden />
                    Interval
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-dark dark:text-white">
                    {formatTimeRange(detail)}
                  </dd>
                </div>

                {location && (
                  <div className="rounded-xl bg-gray-2/70 px-4 py-3 dark:bg-white/[0.04] sm:col-span-2">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                      <MapPin className="size-3.5" aria-hidden />
                      Locație
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-dark dark:text-white">{location}</dd>
                  </div>
                )}

                {budget && (
                  <div className="rounded-xl bg-gray-2/70 px-4 py-3 dark:bg-white/[0.04] sm:col-span-2">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                      <Briefcase className="size-3.5" aria-hidden />
                      Buget
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-dark dark:text-white">{budget}</dd>
                  </div>
                )}
              </dl>

              {description && (
                <div>
                  <h3 className="text-sm font-semibold text-dark dark:text-white">Descriere</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                    {description}
                  </p>
                </div>
              )}

              {materials && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-dark dark:text-white">
                    <Package className="size-4" aria-hidden />
                    Materiale necesare
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                    {materials}
                  </p>
                </div>
              )}

              {project && project.trades.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark dark:text-white">Meserii</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.trades.map((trade) => (
                      <span
                        key={trade}
                        className="rounded-full bg-[#002050]/5 px-2.5 py-1 text-xs font-medium text-[#002050]/75 dark:bg-white/10 dark:text-[#d7e4ff]"
                      >
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project?.client && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-dark dark:text-white">Client</h3>
                  <ClientProfile client={project.client} variant="card" embedded />
                </div>
              )}

              {deleteError && (
                <p className="text-sm text-red dark:text-red-400">{deleteError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-stroke/80 px-5 py-4 dark:border-white/[0.08]">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(detail)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium dark:border-white/[0.12] dark:text-white"
                >
                  <Pencil className="size-4" aria-hidden />
                  Editează
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red/30 px-4 py-2.5 text-sm font-medium text-red hover:bg-red/5 disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden />
                  {deleting ? "..." : "Șterge"}
                </button>
              </>
            )}
            {project && (
              <Link
                href={`/proiecte/${project.id}`}
                onClick={onClose}
                className="flex flex-1 items-center justify-center rounded-xl bg-[#16366d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16366d]/90 dark:bg-[#f1f6ff] dark:text-[#16366d]"
              >
                Vezi proiectul
              </Link>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

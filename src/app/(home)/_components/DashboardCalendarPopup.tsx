"use client";

import { CalendarEventDetailPopup } from "@/app/calendar/_components/CalendarEventDetailPopup";
import {
  CALENDAR_EVENT_TYPE_LABELS,
  formatDayHeading,
  loadUpcomingCalendarEvents,
  type CalendarEvent,
} from "@/lib/worker-calendar";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type DashboardCalendarPopupProps = {
  open: boolean;
  closing: boolean;
  entered: boolean;
  onClose: () => void;
  onEventCountChange?: (count: number) => void;
};

function EventRow({
  event,
  onSelect,
}: {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(event)}
        className="w-full rounded-xl border border-stroke/60 bg-white px-4 py-3 text-left transition-colors hover:border-[#16366d]/20 hover:bg-[#16366d]/[0.03] dark:border-white/[0.08] dark:bg-[#141414] dark:hover:border-[#f1f6ff]/20 dark:hover:bg-white/[0.06]"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-medium text-dark dark:text-white">{event.title}</p>
          <span className="rounded-full bg-[#16366d]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#16366d] dark:bg-[#f1f6ff]/15 dark:text-[#f1f6ff]">
            {CALENDAR_EVENT_TYPE_LABELS[event.type]}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark-5 dark:text-[#9CA3AF]">
          {event.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0" aria-hidden />
              {event.time}
            </span>
          )}
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              {event.location}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

export function DashboardCalendarPopup({
  open,
  closing,
  entered,
  onClose,
  onEventCountChange,
}: DashboardCalendarPopupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<
    { date: Date; dateKey: string; events: CalendarEvent[] }[]
  >([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailEntered, setDetailEntered] = useState(false);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    const result = await loadUpcomingCalendarEvents(3);
    setGrouped(result.grouped);
    setError(result.error ?? null);
    onEventCountChange?.(result.totalEvents);
    setLoading(false);
  }, [onEventCountChange]);

  useEffect(() => {
    if (open) void loadCalendar();
  }, [open, loadCalendar]);

  useEffect(() => {
    if (!selectedEvent) {
      setDetailEntered(false);
      return;
    }
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDetailEntered(true));
    });
    return () => cancelAnimationFrame(t);
  }, [selectedEvent]);

  useEffect(() => {
    if (!detailClosing) return;
    const t = setTimeout(() => {
      setSelectedEvent(null);
      setDetailClosing(false);
    }, 160);
    return () => clearTimeout(t);
  }, [detailClosing]);

  const closeDetail = () => setDetailClosing(true);

  if (!open || typeof document === "undefined") return null;

  return (
    <>
      {createPortal(
        <>
          <div
            className={`fixed inset-0 z-[110] bg-black/50 backdrop-blur-md ${
              closing ? "animate-backdrop-exit" : entered ? "animate-backdrop-enter" : "opacity-0"
            }`}
            aria-hidden
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-title"
              className={`pointer-events-auto flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1A1A1A] dark:ring-1 dark:ring-white/[0.08] ${
                closing ? "animate-modal-exit" : entered ? "animate-modal-enter" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-stroke/80 px-5 py-4 dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-blue/15 dark:bg-blue/20">
                    <Calendar size={22} strokeWidth={2} className="text-blue-500 dark:text-blue-400" />
                  </span>
                  <div>
                    <h2 id="calendar-title" className="text-lg font-semibold tracking-tight text-dark dark:text-white">
                      Calendarul meu
                    </h2>
                    <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
                      {loading ? "Se încarcă..." : "Următoarele 3 zile"}
                    </p>
                  </div>
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

              <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
                      />
                    ))}
                  </div>
                ) : error ? (
                  <p className="rounded-xl bg-gray-2/80 px-4 py-3.5 text-sm text-dark-5 dark:bg-white/[0.04] dark:text-[#9CA3AF]">
                    {error}
                  </p>
                ) : (
                  grouped.map(({ date, dateKey, events }) => (
                    <section key={dateKey}>
                      <h3 className="mb-2 text-sm font-semibold text-dark dark:text-white">
                        {formatDayHeading(date)}
                      </h3>
                      {events.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-stroke/60 bg-gray-2/50 px-4 py-3 text-sm text-dark-5 dark:border-white/10 dark:bg-white/[0.03] dark:text-[#9CA3AF]">
                          Nimic planificat
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {events.map((event) => (
                            <EventRow key={event.id} event={event} onSelect={setSelectedEvent} />
                          ))}
                        </ul>
                      )}
                    </section>
                  ))
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      <CalendarEventDetailPopup
        event={selectedEvent}
        closing={detailClosing}
        entered={detailEntered}
        onClose={closeDetail}
      />
    </>
  );
}

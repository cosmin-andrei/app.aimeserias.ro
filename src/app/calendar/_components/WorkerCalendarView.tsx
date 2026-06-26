"use client";

import { CalendarEventDetailPopup } from "./CalendarEventDetailPopup";
import { CalendarEventFormModal } from "./CalendarEventFormModal";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarThreeDayView } from "./CalendarThreeDayView";
import {
  CALENDAR_EVENT_CHIP_STYLES,
  CALENDAR_EVENT_TYPE_LABELS,
  formatMonthYear,
  formatThreeDayHeading,
  getNextDays,
  loadCalendarEventsInRange,
  minutesToTimeLabel,
  type CalendarEvent,
  type CalendarViewMode,
} from "@/lib/worker-calendar";
import { pageWidthClass } from "@/lib/page-layout";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function WorkerCalendarView() {
  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [threeDayStart, setThreeDayStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailEntered, setDetailEntered] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formClosing, setFormClosing] = useState(false);
  const [formEntered, setFormEntered] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formPreset, setFormPreset] = useState<{ dateKey?: string; time?: string }>();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const threeDays = useMemo(() => getNextDays(3, threeDayStart), [threeDayStart]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    if (viewMode === "month") {
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      const result = await loadCalendarEventsInRange(from, to);
      setEvents(result.events);
      setError(result.error ?? null);
    } else {
      const to = new Date(threeDays[2]);
      const result = await loadCalendarEventsInRange(threeDays[0], to);
      setEvents(result.events);
      setError(result.error ?? null);
    }
    setLoading(false);
  }, [viewMode, year, month, threeDays]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

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

  useEffect(() => {
    if (!formOpen) {
      setFormEntered(false);
      return;
    }
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFormEntered(true));
    });
    return () => cancelAnimationFrame(t);
  }, [formOpen]);

  useEffect(() => {
    if (!formClosing) return;
    const t = setTimeout(() => {
      setFormOpen(false);
      setFormClosing(false);
      setEditingEvent(null);
      setFormPreset(undefined);
    }, 160);
    return () => clearTimeout(t);
  }, [formClosing]);

  const openForm = (event?: CalendarEvent | null, preset?: { dateKey?: string; time?: string }) => {
    setEditingEvent(event ?? null);
    setFormPreset(preset);
    setFormClosing(false);
    setFormOpen(true);
  };

  const closeForm = () => setFormClosing(true);

  const openEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailClosing(false);
  };

  const closeEvent = () => setDetailClosing(true);

  const goToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    setThreeDayStart(start);
  };

  const navigate = (direction: number) => {
    if (viewMode === "month") {
      setViewDate(new Date(year, month + direction, 1));
    } else {
      const next = new Date(threeDayStart);
      next.setDate(next.getDate() + direction * 3);
      setThreeDayStart(next);
    }
  };

  const headerLabel =
    viewMode === "month" ? formatMonthYear(year, month) : formatThreeDayHeading(threeDays);

  return (
    <>
      <div className={pageWidthClass}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dark dark:text-white md:text-3xl">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-dark-5 dark:text-[#9CA3AF]">
              Planifică lucrări, materiale și întâlniri
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openForm()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#16366d] px-4 py-2 text-sm font-medium text-white hover:bg-[#16366d]/90 dark:bg-[#f1f6ff] dark:text-[#16366d]"
            >
              <Plus className="size-4" aria-hidden />
              Adaugă lucrare
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-xl border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark shadow-sm hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white"
            >
              Astăzi
            </button>
            <div className="flex rounded-xl border border-stroke bg-white p-1 dark:border-white/[0.12] dark:bg-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  viewMode === "month"
                    ? "bg-[#16366d] text-white dark:bg-[#f1f6ff] dark:text-[#16366d]"
                    : "text-dark-5 dark:text-[#9CA3AF]"
                }`}
              >
                Lună
              </button>
              <button
                type="button"
                onClick={() => setViewMode("threeDay")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  viewMode === "threeDay"
                    ? "bg-[#16366d] text-white dark:bg-[#f1f6ff] dark:text-[#16366d]"
                    : "text-dark-5 dark:text-[#9CA3AF]"
                }`}
              >
                3 zile
              </button>
            </div>
            <div className="flex items-center rounded-xl border border-stroke bg-white shadow-sm dark:border-white/[0.12] dark:bg-white/[0.08]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex size-10 items-center justify-center rounded-l-xl text-dark-5 hover:bg-gray-1 dark:hover:bg-white/10"
                aria-label="Înapoi"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="min-w-[10rem] px-2 text-center text-sm font-semibold text-dark dark:text-white">
                {headerLabel}
              </span>
              <button
                type="button"
                onClick={() => navigate(1)}
                className="flex size-10 items-center justify-center rounded-r-xl text-dark-5 hover:bg-gray-1 dark:hover:bg-white/10"
                aria-label="Înainte"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {error && !loading && (
          <p className="mb-4 rounded-xl border border-red/20 bg-red/5 px-4 py-2.5 text-sm text-red dark:text-red-400">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-stroke/80 bg-white shadow-sm ring-1 ring-black/[0.04] dark:border-white/[0.08] dark:bg-[#141414] dark:ring-white/[0.06]">
          {viewMode === "month" ? (
            <CalendarMonthView
              year={year}
              month={month}
              events={events}
              loading={loading}
              onEventClick={openEvent}
              onDayClick={(dateKey) => openForm(null, { dateKey, time: "09:00" })}
            />
          ) : (
            <CalendarThreeDayView
              days={threeDays}
              events={events}
              loading={loading}
              onEventClick={openEvent}
              onSlotClick={(dateKey, hour) =>
                openForm(null, { dateKey, time: minutesToTimeLabel(hour * 60) })
              }
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(CALENDAR_EVENT_TYPE_LABELS) as Array<keyof typeof CALENDAR_EVENT_TYPE_LABELS>).map(
            (type) => (
              <span
                key={type}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${CALENDAR_EVENT_CHIP_STYLES[type]}`}
              >
                {CALENDAR_EVENT_TYPE_LABELS[type]}
              </span>
            )
          )}
        </div>
      </div>

      <CalendarEventDetailPopup
        event={selectedEvent}
        closing={detailClosing}
        entered={detailEntered}
        onClose={closeEvent}
        onEdit={(event) => {
          closeEvent();
          setTimeout(() => openForm(event), 180);
        }}
        onDeleted={() => {
          closeEvent();
          void loadEvents();
        }}
      />

      <CalendarEventFormModal
        open={formOpen}
        closing={formClosing}
        entered={formEntered}
        editingEvent={editingEvent}
        preset={formPreset}
        onClose={closeForm}
        onSaved={() => void loadEvents()}
      />
    </>
  );
}

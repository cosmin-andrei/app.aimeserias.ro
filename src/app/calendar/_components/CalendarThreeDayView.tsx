"use client";

import {
  CALENDAR_EVENT_CHIP_STYLES,
  CALENDAR_EVENT_TYPE_LABELS,
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_HEIGHT,
  CALENDAR_HOUR_START,
  formatDayHeading,
  getEventMinutesRange,
  getEventsForDate,
  toDateKey,
  type CalendarEvent,
} from "@/lib/worker-calendar";

type CalendarThreeDayViewProps = {
  days: Date[];
  events: CalendarEvent[];
  loading: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (dateKey: string, hour: number) => void;
};

const HOURS = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START },
  (_, i) => CALENDAR_HOUR_START + i
);

export function CalendarThreeDayView({
  days,
  events,
  loading,
  onEventClick,
  onSlotClick,
}: CalendarThreeDayViewProps) {
  const gridHeight = HOURS.length * CALENDAR_HOUR_HEIGHT;
  const dayStartMinutes = CALENDAR_HOUR_START * 60;
  const dayEndMinutes = CALENDAR_HOUR_END * 60;
  const totalMinutes = dayEndMinutes - dayStartMinutes;

  if (loading) {
    return (
      <div className="grid min-h-[32rem] place-items-center p-8">
        <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă calendarul...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div
          className="grid border-b border-stroke/80 dark:border-white/[0.08]"
          style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div />
          {days.map((day) => (
            <div
              key={toDateKey(day)}
              className="border-l border-stroke/80 px-3 py-3 text-center dark:border-white/[0.08]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#16366d]/80 dark:text-[#c5d4f5]">
                {day.toLocaleDateString("ro-RO", { weekday: "short" })}
              </p>
              <p className="mt-0.5 text-sm font-bold text-dark dark:text-white">
                {formatDayHeading(day)}
              </p>
            </div>
          ))}
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="relative" style={{ height: gridHeight }}>
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-stroke/50 pr-2 text-right text-[10px] text-dark-5 dark:border-white/[0.06] dark:text-[#9CA3AF]"
                style={{ top: index * CALENDAR_HOUR_HEIGHT, height: CALENDAR_HOUR_HEIGHT }}
              >
                <span className="-mt-2 inline-block">{`${String(hour).padStart(2, "0")}:00`}</span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dateKey = toDateKey(day);
            const dayEvents = getEventsForDate(events, dateKey);

            return (
              <div
                key={dateKey}
                className="relative border-l border-stroke/80 bg-white dark:border-white/[0.08] dark:bg-[#141414]"
                style={{ height: gridHeight }}
              >
                {HOURS.map((hour, index) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => onSlotClick(dateKey, hour)}
                    className="absolute inset-x-0 border-t border-stroke/40 transition-colors hover:bg-[#16366d]/[0.04] dark:border-white/[0.05] dark:hover:bg-white/[0.04]"
                    style={{ top: index * CALENDAR_HOUR_HEIGHT, height: CALENDAR_HOUR_HEIGHT }}
                    aria-label={`Adaugă lucrare ${dateKey} ora ${hour}`}
                  />
                ))}

                {dayEvents.map((event) => {
                  const { start, end } = getEventMinutesRange(event);
                  const clampedStart = Math.max(start, dayStartMinutes);
                  const clampedEnd = Math.min(end, dayEndMinutes);
                  if (clampedEnd <= clampedStart) return null;

                  const top = ((clampedStart - dayStartMinutes) / totalMinutes) * gridHeight;
                  const height = Math.max(
                    ((clampedEnd - clampedStart) / totalMinutes) * gridHeight,
                    28
                  );

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick(event)}
                      className={`absolute inset-x-1 z-10 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] font-medium shadow-sm ring-1 ring-black/10 ${CALENDAR_EVENT_CHIP_STYLES[event.type]}`}
                      style={{ top, height }}
                      title={event.title}
                    >
                      <span className="block truncate font-semibold">{event.title}</span>
                      <span className="block truncate text-[10px] opacity-90">
                        {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

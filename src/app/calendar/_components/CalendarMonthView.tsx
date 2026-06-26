"use client";

import {
  CALENDAR_EVENT_CHIP_STYLES,
  getEventsForDate,
  getMonthWeeks,
  WEEKDAY_LABELS,
  type CalendarEvent,
} from "@/lib/worker-calendar";

type CalendarMonthViewProps = {
  year: number;
  month: number;
  events: CalendarEvent[];
  loading: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick?: (dateKey: string) => void;
};

export function CalendarMonthView({
  year,
  month,
  events,
  loading,
  onEventClick,
  onDayClick,
}: CalendarMonthViewProps) {
  const weeks = getMonthWeeks(year, month);

  if (loading) {
    return (
      <div className="grid min-h-[32rem] place-items-center p-8">
        <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă calendarul...</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-7 border-b border-stroke/80 bg-[#16366d]/[0.04] dark:border-white/[0.08] dark:bg-white/[0.03]">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#16366d]/80 dark:text-[#c5d4f5]"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-stroke/60 dark:divide-white/[0.06]">
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 divide-x divide-stroke/60 dark:divide-white/[0.06]"
          >
            {week.map((cell) => {
              const dayEvents = getEventsForDate(events, cell.dateKey);
              const visibleEvents = dayEvents.slice(0, 3);
              const hiddenCount = dayEvents.length - visibleEvents.length;

              return (
                <div
                  key={cell.dateKey}
                  className={`min-h-[7.5rem] p-1.5 sm:min-h-[8.5rem] sm:p-2 ${
                    cell.inCurrentMonth
                      ? "bg-white dark:bg-[#141414]"
                      : "bg-gray-1/60 dark:bg-[#101010]"
                  }`}
                >
                  <div className="mb-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDayClick?.(cell.dateKey)}
                      className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:size-8 sm:text-sm ${
                        cell.isToday
                          ? "bg-[#16366d] text-white dark:bg-[#f1f6ff] dark:text-[#16366d]"
                          : cell.inCurrentMonth
                            ? "text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-white/10"
                            : "text-dark-5/70 dark:text-[#9CA3AF]/60"
                      }`}
                    >
                      {cell.date.getDate()}
                    </button>
                  </div>

                  <div className="space-y-1">
                    {visibleEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onEventClick(event)}
                        title={`${event.time ? `${event.time} · ` : ""}${event.title}`}
                        className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors sm:px-2 sm:py-1 sm:text-[11px] ${CALENDAR_EVENT_CHIP_STYLES[event.type]}`}
                      >
                        {event.time && <span className="mr-1 opacity-90">{event.time}</span>}
                        {event.title}
                      </button>
                    ))}
                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onEventClick(dayEvents[3])}
                        className="w-full rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium text-[#16366d] hover:bg-[#16366d]/10 dark:text-[#c5d4f5] dark:hover:bg-white/10 sm:text-[11px]"
                      >
                        +{hiddenCount} {hiddenCount === 1 ? "lucrare" : "lucrări"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

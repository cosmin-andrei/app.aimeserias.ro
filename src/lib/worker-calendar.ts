import {
  getCalendarEvents,
  getWorkerMyJobs,
  type ApiCalendarEventItem,
  type WorkerJobItem,
} from "@/lib/api-client";
import { getProjectById, PROJECTS, getStatusStyle } from "@/lib/project";
import type { Project } from "@/types/project";

export type CalendarEventType = "site_visit" | "work" | "meeting" | "deadline" | "maintenance";
export type CalendarViewMode = "month" | "threeDay";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  type: CalendarEventType;
  jobId?: number;
  projectId?: string;
  description?: string;
  materials?: string;
  category?: string;
  budgetLabel?: string;
  status?: string;
  job?: WorkerJobItem;
  isCustom?: boolean;
  customEventId?: number;
};

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  site_visit: "Vizită pe șantier",
  work: "Lucrări",
  meeting: "Întâlnire client",
  deadline: "Termen limită",
  maintenance: "Mentenanță / reparație",
};

export const CALENDAR_EVENT_CHIP_STYLES: Record<CalendarEventType, string> = {
  site_visit: "bg-amber-500/90 text-white hover:bg-amber-600",
  work: "bg-[#16366d] text-white hover:bg-[#0f2854] dark:bg-[#3d5a9e] dark:hover:bg-[#4a6ab0]",
  meeting: "bg-emerald-600 text-white hover:bg-emerald-700",
  deadline: "bg-rose-600 text-white hover:bg-rose-700",
  maintenance: "bg-violet-600 text-white hover:bg-violet-700",
};

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"] as const;

export const MONTH_LABELS = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;

export const CALENDAR_HOUR_START = 6;
export const CALENDAR_HOUR_END = 22;
export const CALENDAR_HOUR_HEIGHT = 52;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildLocalDateTime(dateKey: string, time: string): Date {
  return new Date(`${dateKey}T${time}:00`);
}

export function buildIsoFromDateAndTime(dateKey: string, time: string): string {
  return buildLocalDateTime(dateKey, time).toISOString();
}

export function getEventMinutesRange(event: CalendarEvent): { start: number; end: number } {
  if (event.startsAt && event.endsAt) {
    const start = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    return {
      start: start.getHours() * 60 + start.getMinutes(),
      end: Math.max(end.getHours() * 60 + end.getMinutes(), start.getHours() * 60 + start.getMinutes() + 30),
    };
  }
  const start = event.time ? parseTimeToMinutes(event.time) : 9 * 60;
  const end = event.endTime ? parseTimeToMinutes(event.endTime) : start + 60;
  return { start, end: Math.max(end, start + 30) };
}

export function formatTimeRange(event: CalendarEvent): string {
  const { start, end } = getEventMinutesRange(event);
  return `${minutesToTimeLabel(start)} – ${minutesToTimeLabel(end)}`;
}

export function getNextDays(count: number, from = new Date()): Date[] {
  const days: Date[] = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

export function formatDayHeading(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Astăzi";
  if (target.getTime() === tomorrow.getTime()) return "Mâine";

  const label = target.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_LABELS[month]} ${year}`;
}

export function formatThreeDayHeading(days: Date[]): string {
  if (days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${MONTH_LABELS[first.getMonth()].slice(0, 3)} – ${last.getDate()} ${MONTH_LABELS[last.getMonth()].slice(0, 3)} ${last.getFullYear()}`;
}

export type CalendarDayCell = {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
};

export function getMonthWeeks(year: number, month: number): CalendarDayCell[][] {
  const todayKey = toDateKey(new Date());
  const start = new Date(year, month, 1);
  const startOffset = (start.getDay() + 6) % 7;
  const cursor = new Date(year, month, 1 - startOffset);
  const weeks: CalendarDayCell[][] = [];

  for (let w = 0; w < 6; w++) {
    const week: CalendarDayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      const dateKey = toDateKey(date);
      week.push({
        date,
        dateKey,
        inCurrentMonth: date.getMonth() === month,
        isToday: dateKey === todayKey,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function jobStatusToEventType(status: string): CalendarEventType {
  if (status === "assigned") return "site_visit";
  if (status === "in_progress") return "work";
  return "work";
}

function mapJobStatus(status: string): string {
  const labels: Record<string, string> = {
    open: "Deschis",
    assigned: "Atribuit",
    in_progress: "În desfășurare",
    completed: "Finalizat",
    cancelled: "Anulat",
  };
  return labels[status] ?? status;
}

function formatJobBudget(job: WorkerJobItem): string | undefined {
  if (job.budget_min != null && job.budget_max != null) {
    return `${job.budget_min.toLocaleString("ro-RO")} – ${job.budget_max.toLocaleString("ro-RO")} RON`;
  }
  if (job.budget_min != null) {
    return `de la ${job.budget_min.toLocaleString("ro-RO")} RON`;
  }
  if (job.budget_max != null) {
    return `până la ${job.budget_max.toLocaleString("ro-RO")} RON`;
  }
  return undefined;
}

function findProjectForJob(job: WorkerJobItem): Project | undefined {
  const exact = PROJECTS.find((p) => p.title === job.title);
  if (exact) return exact;

  const cityLower = job.city.toLowerCase();
  return PROJECTS.find(
    (p) =>
      p.location.toLowerCase().includes(cityLower) ||
      cityLower.includes(p.county.toLowerCase())
  );
}

function enrichWithProject(event: CalendarEvent, project?: Project | null): CalendarEvent {
  if (!project) return event;
  return {
    ...event,
    projectId: project.id,
    title: project.title,
    location: project.location,
    description: project.excerpt,
    category: project.category,
    budgetLabel: project.budget,
    status: project.status,
  };
}

function enrichCalendarEvent(event: CalendarEvent, job?: WorkerJobItem): CalendarEvent {
  if (job) {
    const project = findProjectForJob(job);
    if (project) {
      return enrichWithProject({ ...event, job }, project);
    }

    return {
      ...event,
      job,
      description: job.description,
      category: job.category,
      budgetLabel: formatJobBudget(job),
      status: mapJobStatus(job.status),
      location: job.city,
    };
  }

  if (event.projectId) {
    return enrichWithProject(event, getProjectById(event.projectId));
  }

  return event;
}

export function apiEventToCalendarEvent(item: ApiCalendarEventItem): CalendarEvent {
  const start = new Date(item.starts_at);
  const end = new Date(item.ends_at);
  const base: CalendarEvent = {
    id: `custom-${item.id}`,
    customEventId: item.id,
    isCustom: true,
    title: item.title,
    date: toDateKey(start),
    time: formatTime(start),
    endTime: formatTime(end),
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    location: item.location ?? undefined,
    type: item.event_type,
    description: item.description ?? undefined,
    materials: item.materials ?? undefined,
    projectId: item.project_id ?? undefined,
    jobId: item.job_id ?? undefined,
  };
  return enrichCalendarEvent(base);
}

export function jobsToCalendarEvents(jobs: WorkerJobItem[]): CalendarEvent[] {
  return jobs
    .filter((job) => job.scheduled_at)
    .map((job) => {
      const scheduled = new Date(job.scheduled_at!);
      const ends = new Date(scheduled.getTime() + 60 * 60 * 1000);
      const base: CalendarEvent = {
        id: `job-${job.id}`,
        title: job.title,
        date: toDateKey(scheduled),
        time: formatTime(scheduled),
        endTime: formatTime(ends),
        startsAt: scheduled.toISOString(),
        endsAt: ends.toISOString(),
        location: job.city,
        type: jobStatusToEventType(job.status),
        jobId: job.id,
      };
      return enrichCalendarEvent(base, job);
    });
}

function eventOverlapsRange(event: CalendarEvent, from: Date, to: Date): boolean {
  const start = event.startsAt ? new Date(event.startsAt) : buildLocalDateTime(event.date, event.time || "09:00");
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  return start < to && end > from;
}

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aStart = a.startsAt || buildIsoFromDateAndTime(a.date, a.time || "00:00");
    const bStart = b.startsAt || buildIsoFromDateAndTime(b.date, b.time || "00:00");
    return aStart.localeCompare(bStart);
  });
}

export function filterEventsForDays(events: CalendarEvent[], days: Date[]): CalendarEvent[] {
  const dayKeys = new Set(days.map(toDateKey));
  return events.filter((event) => dayKeys.has(event.date));
}

export function groupEventsByDay(
  events: CalendarEvent[],
  days: Date[]
): { date: Date; dateKey: string; events: CalendarEvent[] }[] {
  const byDate = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const list = byDate.get(event.date) ?? [];
    list.push(event);
    byDate.set(event.date, list);
  }

  return days.map((date) => {
    const dateKey = toDateKey(date);
    const dayEvents = sortEvents(byDate.get(dateKey) ?? []);
    return { date, dateKey, events: dayEvents };
  });
}

export function getEventsForDate(events: CalendarEvent[], dateKey: string): CalendarEvent[] {
  return sortEvents(events.filter((event) => event.date === dateKey));
}

export function getCalendarEventDetail(event: CalendarEvent): {
  event: CalendarEvent;
  project: Project | null;
} {
  const project = event.projectId ? getProjectById(event.projectId) ?? null : null;
  return { event, project };
}

export { getStatusStyle };

export async function loadCalendarEventsInRange(
  from: Date,
  to: Date
): Promise<{
  events: CalendarEvent[];
  error?: string;
}> {
  const rangeStart = new Date(from);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(to);
  rangeEnd.setHours(23, 59, 59, 999);

  const [{ data: customData, error: customError }, { data: jobs, error: jobsError }] =
    await Promise.all([
      getCalendarEvents(rangeStart.toISOString(), rangeEnd.toISOString()),
      getWorkerMyJobs(),
    ]);

  const customEvents = (customData?.events ?? []).map(apiEventToCalendarEvent);
  const jobEvents = jobsToCalendarEvents(jobs ?? []).filter((event) =>
    eventOverlapsRange(event, rangeStart, rangeEnd)
  );

  return {
    events: sortEvents([...customEvents, ...jobEvents]),
    error: customError || jobsError,
  };
}

export async function loadMonthCalendarEvents(
  year: number,
  month: number
): Promise<{
  events: CalendarEvent[];
  usesDemoData: boolean;
  error?: string;
}> {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const result = await loadCalendarEventsInRange(from, to);
  return {
    events: result.events,
    usesDemoData: false,
    error: result.error,
  };
}

export async function loadUpcomingCalendarEvents(daysCount = 3): Promise<{
  days: Date[];
  grouped: { date: Date; dateKey: string; events: CalendarEvent[] }[];
  totalEvents: number;
  error?: string;
}> {
  const days = getNextDays(daysCount);
  const rangeEnd = new Date(days[days.length - 1]);
  const { events, error } = await loadCalendarEventsInRange(days[0], rangeEnd);

  const filtered = filterEventsForDays(events, days);
  const grouped = groupEventsByDay(filtered, days);

  return {
    days,
    grouped,
    totalEvents: filtered.length,
    error,
  };
}

export function calendarEventToFormDefaults(
  event?: CalendarEvent | null,
  preset?: { dateKey?: string; time?: string }
) {
  const dateKey = event?.date ?? preset?.dateKey ?? toDateKey(new Date());
  const { start, end } = event
    ? getEventMinutesRange(event)
    : {
        start: preset?.time ? parseTimeToMinutes(preset.time) : 9 * 60,
        end: (preset?.time ? parseTimeToMinutes(preset.time) : 9 * 60) + 60,
      };

  return {
    title: event?.title ?? "",
    event_type: event?.type ?? ("work" as CalendarEventType),
    dateKey,
    startTime: minutesToTimeLabel(start),
    endTime: minutesToTimeLabel(end),
    location: event?.location ?? "",
    description: event?.description ?? "",
    materials: event?.materials ?? "",
    projectId: event?.projectId ?? "",
  };
}

export function formDefaultsToPayload(form: {
  title: string;
  event_type: CalendarEventType;
  dateKey: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  materials: string;
  projectId: string;
}) {
  return {
    title: form.title.trim(),
    event_type: form.event_type,
    location: form.location.trim() || null,
    description: form.description.trim() || null,
    materials: form.materials.trim() || null,
    project_id: form.projectId.trim() || null,
    starts_at: buildIsoFromDateAndTime(form.dateKey, form.startTime),
    ends_at: buildIsoFromDateAndTime(form.dateKey, form.endTime),
  };
}

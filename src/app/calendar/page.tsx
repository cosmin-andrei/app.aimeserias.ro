import { WorkerCalendarView } from "./_components/WorkerCalendarView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Programările tale de lucrări, mentenanță și întâlniri.",
};

export default function CalendarPage() {
  return <WorkerCalendarView />;
}

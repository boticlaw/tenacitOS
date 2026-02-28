"use client";

import { WeeklyCalendar } from "@/components/WeeklyCalendar";

export default function CalendarPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
        <p className="text-neutral-400">
          Weekly view of scheduled tasks and cron jobs
        </p>
      </div>

      <WeeklyCalendar />
    </div>
  );
}

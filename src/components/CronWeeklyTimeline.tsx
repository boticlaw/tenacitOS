"use client";

import { useMemo } from "react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { Clock, Repeat, CalendarX } from "lucide-react";
import { getNextRuns, isValidCron } from "@/lib/cron-parser";
import type { CronJob } from "./CronJobCard";

interface ScheduledEvent {
  job: CronJob;
  time: Date;
  color: string;
  isInterval: boolean;
}

interface DayColumn {
  date: Date;
  label: string;
  subLabel: string;
  isToday: boolean;
  events: ScheduledEvent[];
  intervalJobs: { job: CronJob; color: string; intervalLabel: string }[];
}

// Pastel-ish colors that look great on dark backgrounds
const JOB_COLORS = [
  "#FF6B6B", // coral red
  "#4FC3F7", // sky blue
  "#81C784", // sage green
  "#FFB74D", // amber
  "#CE93D8", // lavender
  "#F48FB1", // pink
  "#80DEEA", // teal
  "#FFCC02", // yellow (TenacitOS accent)
  "#A5D6A7", // mint
  "#FF8A65", // deep orange
];

function getJobColor(index: number): string {
  return JOB_COLORS[index % JOB_COLORS.length];
}

function getScheduleExpr(schedule: string | Record<string, unknown>): string | null {
  if (typeof schedule === "string") return schedule;
  if (schedule && typeof schedule === "object" && schedule.kind === "cron") {
    return (schedule.expr as string) || null;
  }
  return null;
}

function getIntervalMs(schedule: string | Record<string, unknown>): number | null {
  if (typeof schedule === "object" && schedule && schedule.kind === "every") {
    return (schedule.everyMs as number) || null;
  }
  return null;
}

function getAtTime(schedule: string | Record<string, unknown>): Date | null {
  if (typeof schedule === "object" && schedule && schedule.kind === "at") {
    const at = schedule.at as string;
    if (at) return new Date(at);
  }
  return null;
}

function formatIntervalLabel(ms: number): string {
  if (ms >= 86400000) return `Every ${Math.round(ms / 86400000)}d`;
  if (ms >= 3600000) return `Every ${Math.round(ms / 3600000)}h`;
  if (ms >= 60000) return `Every ${Math.round(ms / 60000)}m`;
  return `Every ${Math.round(ms / 1000)}s`;
}

function getJobEmoji(agentId: string): string {
  const emojis: Record<string, string> = {
    main: "🫙",
    academic: "🎓",
    infra: "🔧",
    studio: "🎬",
    social: "📱",
    linkedin: "💼",
    freelance: "💼",
  };
  return emojis[agentId] || "🤖";
}

interface CronWeeklyTimelineProps {
  jobs: CronJob[];
}

export function CronWeeklyTimeline({ jobs }: CronWeeklyTimelineProps) {
  const now = useMemo(() => new Date(), []);
  const sevenDaysOut = useMemo(
    () => new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    [now]
  );

  const days = useMemo<DayColumn[]>(() => {
    const enabledJobs = jobs.filter((j) => j.enabled);

    // Compute all events for next 7 days
    const allEvents: ScheduledEvent[] = [];
    const intervalJobMap = new Map<
      string,
      { job: CronJob; color: string; intervalLabel: string }
    >();

    enabledJobs.forEach((job, idx) => {
      const color = getJobColor(idx);
      const expr = getScheduleExpr(job.schedule);
      const intervalMs = getIntervalMs(job.schedule);
      const atTime = getAtTime(job.schedule);

      if (expr && isValidCron(expr)) {
        // Cron: compute next N runs
        const runs = getNextRuns(expr, 50, now);
        runs
          .filter((r) => r >= startOfDay(now) && r <= sevenDaysOut)
          .forEach((time) => {
            allEvents.push({ job, time, color, isInterval: false });
          });
      } else if (intervalMs) {
        // Interval job: show in each day but don't enumerate every tick
        // Just mark the days it's "active"
        const label = formatIntervalLabel(intervalMs);
        if (!intervalJobMap.has(job.id)) {
          intervalJobMap.set(job.id, { job, color, intervalLabel: label });
        }
        // If interval >= 24h, show individual occurrences
        if (intervalMs >= 86400000) {
          let next = job.nextRun ? new Date(job.nextRun) : now;
          while (next <= sevenDaysOut) {
            if (next >= startOfDay(now)) {
              allEvents.push({ job, time: new Date(next), color, isInterval: true });
            }
            next = new Date(next.getTime() + intervalMs);
          }
        }
      } else if (atTime && atTime > now && atTime <= sevenDaysOut) {
        // One-time job
        allEvents.push({ job, time: atTime, color, isInterval: false });
      }
    });

    // Build day columns
    const columns: DayColumn[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfDay(now), i);
      const dayEnd = addDays(date, 1);
      const isToday = isSameDay(date, now);

      const dayEvents = allEvents
        .filter((e) => e.time >= date && e.time < dayEnd)
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      // For interval jobs that fire multiple times per day, include in intervalJobs
      const dayIntervalJobs = Array.from(intervalJobMap.values());

      columns.push({
        date,
        label: isToday ? "Today" : format(date, "EEE d"),
        subLabel: isToday ? format(date, "EEE d") : format(date, "MMM"),
        isToday,
        events: dayEvents,
        intervalJobs: dayIntervalJobs,
      });
    }

    return columns;
  }, [jobs, now, sevenDaysOut]);

  const totalEvents = useMemo(
    () => days.reduce((sum, d) => sum + d.events.length, 0),
    [days]
  );

  if (jobs.filter((j) => j.enabled).length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 0",
          color: "var(--text-muted)",
          gap: "1rem",
        }}
      >
        <CalendarX style={{ width: 48, height: 48, opacity: 0.4 }} />
        <p style={{ fontSize: "0.9rem" }}>No active jobs to display</p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {jobs
          .filter((j) => j.enabled)
          .map((job, idx) => (
            <div
              key={job.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "9999px",
                backgroundColor: `${getJobColor(idx)}18`,
                border: `1px solid ${getJobColor(idx)}40`,
                fontSize: "0.75rem",
                color: getJobColor(idx),
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: getJobColor(idx),
                  flexShrink: 0,
                }}
              />
              {getJobEmoji(job.agentId)} {job.name}
            </div>
          ))}
        <div
          style={{
            marginLeft: "auto",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            alignSelf: "center",
          }}
        >
          {totalEvents} scheduled events in the next 7 days
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
          overflowX: "auto",
        }}
      >
        {days.map((day) => (
          <div
            key={day.date.toISOString()}
            style={{
              backgroundColor: day.isToday
                ? "color-mix(in srgb, var(--accent) 8%, var(--card))"
                : "var(--card)",
              border: day.isToday
                ? "1px solid color-mix(in srgb, var(--accent) 40%, transparent)"
                : "1px solid var(--border)",
              borderRadius: "0.75rem",
              overflow: "hidden",
              minWidth: "120px",
            }}
          >
            {/* Day Header */}
            <div
              style={{
                padding: "0.5rem 0.75rem",
                borderBottom: "1px solid var(--border)",
                backgroundColor: day.isToday
                  ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                  : "transparent",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: day.isToday ? "var(--accent)" : "var(--text-primary)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {day.label}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  marginTop: "1px",
                }}
              >
                {day.subLabel}
              </div>
            </div>

            {/* Events */}
            <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem", minHeight: "80px" }}>
              {day.events.length === 0 && day.intervalJobs.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "80px",
                    color: "var(--text-muted)",
                    fontSize: "0.7rem",
                    opacity: 0.5,
                  }}
                >
                  —
                </div>
              )}

              {/* One-time / cron events */}
              {day.events.map((event, eIdx) => (
                <div
                  key={`${event.job.id}-${eIdx}`}
                  title={`${event.job.name}\n${format(event.time, "HH:mm")}`}
                  style={{
                    padding: "0.3rem 0.5rem",
                    borderRadius: "0.4rem",
                    backgroundColor: `${event.color}18`,
                    border: `1px solid ${event.color}35`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.65rem",
                      color: event.color,
                      fontWeight: 700,
                    }}
                  >
                    <Clock style={{ width: 9, height: 9, flexShrink: 0 }} />
                    {format(event.time, "HH:mm")}
                    {event.isInterval && (
                      <Repeat style={{ width: 9, height: 9, opacity: 0.7 }} />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {getJobEmoji(event.job.agentId)} {event.job.name}
                  </div>
                </div>
              ))}

              {/* Interval jobs (< 24h frequency) */}
              {day.intervalJobs.map(({ job, color, intervalLabel }) => (
                <div
                  key={`${job.id}-interval`}
                  title={`${job.name} — ${intervalLabel}`}
                  style={{
                    padding: "0.3rem 0.5rem",
                    borderRadius: "0.4rem",
                    backgroundColor: `${color}12`,
                    border: `1px solid ${color}25`,
                    borderStyle: "dashed",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.65rem",
                      color: color,
                      fontWeight: 700,
                    }}
                  >
                    <Repeat style={{ width: 9, height: 9, flexShrink: 0 }} />
                    {intervalLabel}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getJobEmoji(job.agentId)} {job.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

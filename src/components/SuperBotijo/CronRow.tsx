/**
 * CronRow Component
 * Based on Component/CronRow from tenacios-design.json
 */

import { Clock } from "lucide-react";

interface CronRowProps {
  name: string;
  nextRun: string;
  status: "OK" | "WARN" | "ERROR";
}

export function CronRow({ name, nextRun, status }: CronRowProps) {
  const statusColors = {
    OK: {
      bg: "var(--positive-soft)",
      text: "var(--positive)",
    },
    WARN: {
      bg: "var(--warning-soft)",
      text: "var(--warning)",
    },
    ERROR: {
      bg: "var(--negative-soft)",
      text: "var(--negative)",
    },
  };

  const colors = statusColors[status];

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "8px",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Clock Icon */}
      <Clock
        style={{
          width: "16px",
          height: "16px",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      />

      {/* Cron Name */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--text-primary)",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>

      {/* Next Run */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          color: "var(--text-secondary)",
          flexShrink: 0,
        }}
      >
        {nextRun}
      </span>

      {/* Status Badge */}
      <div
        style={{
          backgroundColor: colors.bg,
          borderRadius: "4px",
          padding: "3px 8px",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: colors.text,
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

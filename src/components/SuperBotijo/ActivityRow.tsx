/**
 * ActivityRow Component
 * Based on Component/ActivityRow from tenacios-design.json
 */

interface ActivityRowProps {
  time: string;
  agent: string;
  description: string;
}

export function ActivityRow({ time, agent, description }: ActivityRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Time */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {time}
      </span>

      {/* Agent */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text-primary)",
          flexShrink: 0,
        }}
      >
        {agent}
      </span>

      {/* Dash */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        —
      </span>

      {/* Description */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "var(--text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {description}
      </span>
    </div>
  );
}

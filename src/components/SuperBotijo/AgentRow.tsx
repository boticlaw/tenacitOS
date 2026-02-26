/**
 * AgentRow Component
 * Based on Component/AgentRow from tenacios-design.json
 */

interface AgentRowProps {
  emoji: string;
  name: string;
  status: string;
  model: string;
  statusDot?: "positive" | "info" | "warning" | "negative" | "muted";
}

export function AgentRow({
  emoji,
  name,
  status,
  model,
  statusDot = "positive",
}: AgentRowProps) {
  const dotColorMap = {
    positive: "var(--positive)",
    info: "var(--info)",
    warning: "var(--warning)",
    negative: "var(--negative)",
    muted: "var(--text-muted)",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "8px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Status Dot */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColorMap[statusDot],
          flexShrink: 0,
        }}
      />

      {/* Agent Emoji */}
      <div
        style={{
          fontSize: "18px",
          lineHeight: "18px",
          flexShrink: 0,
        }}
      >
        {emoji}
      </div>

      {/* Agent Info */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {status}
        </div>
      </div>

      {/* Model Badge */}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "1px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {model}
      </div>
    </div>
  );
}

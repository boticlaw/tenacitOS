"use client";

import { ReactNode } from "react";
import { Clock, Coins, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ModelResponse } from "@/lib/playground-storage";

interface ModelResponseCardProps {
  response: ModelResponse;
  isWinner?: boolean;
  winnerMetric?: "speed" | "cost" | "tokens" | null;
}

export function ModelResponseCard({ response, isWinner, winnerMetric }: ModelResponseCardProps) {
  const hasError = !!response.error;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--card)",
        border: isWinner ? "2px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {hasError ? (
            <AlertTriangle size={16} style={{ color: "var(--error)" }} />
          ) : (
            <CheckCircle size={16} style={{ color: "var(--success)" }} />
          )}
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 600,
              color: hasError ? "var(--error)" : "var(--text-primary)",
            }}
          >
            {response.modelName}
          </span>
        </div>
        {isWinner && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "3px 8px",
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              borderRadius: "4px",
            }}
          >
            {winnerMetric === "speed" ? "Fastest" : winnerMetric === "cost" ? "Cheapest" : "Best"}
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface-hover)",
        }}
      >
        <MetricItem
          icon={<Clock size={12} />}
          label="Time"
          value={`${response.responseTime}ms`}
          isHighlighted={winnerMetric === "speed"}
        />
        <MetricItem
          icon={<Coins size={12} />}
          label="Cost"
          value={`$${response.cost.toFixed(4)}`}
          isHighlighted={winnerMetric === "cost"}
        />
        <MetricItem
          icon={<Zap size={12} />}
          label="In/Out"
          value={`${response.inputTokens}/${response.outputTokens}`}
          isHighlighted={winnerMetric === "tokens"}
        />
        <MetricItem
          icon={null}
          label="Total"
          value={`${response.totalTokens}`}
          isHighlighted={false}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
          backgroundColor: "var(--bg)",
        }}
      >
        {hasError ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--error)",
              fontSize: "13px",
            }}
          >
            <AlertTriangle size={16} />
            {response.error}
          </div>
        ) : (
          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: "var(--text-primary)",
            }}
            className="prose prose-sm prose-invert max-w-none"
          >
            <ReactMarkdown>{response.output}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricItem({
  icon,
  label,
  value,
  isHighlighted,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isHighlighted: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)" }}>
        {icon}
        <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: isHighlighted ? "var(--accent)" : "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

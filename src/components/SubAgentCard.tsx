"use client";

import { Bot, Clock, Zap, Cpu, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SubAgentCardProps {
  subagent: {
    id: string;
    parentId: string;
    parentName: string;
    task: string;
    model: string;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    startedAt: string;
    ageMs: number;
    status: "active" | "idle" | "completed" | "failed";
    duration?: number;
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return {
        color: "var(--success)",
        icon: Loader,
        label: "Active",
      };
    case "idle":
      return {
        color: "var(--warning)",
        icon: Clock,
        label: "Idle",
      };
    case "completed":
      return {
        color: "var(--success)",
        icon: CheckCircle,
        label: "Completed",
      };
    case "failed":
      return {
        color: "var(--error)",
        icon: AlertCircle,
        label: "Failed",
      };
    default:
      return {
        color: "var(--text-muted)",
        icon: Clock,
        label: "Unknown",
      };
  }
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function SubAgentCard({ subagent }: SubAgentCardProps) {
  const statusInfo = getStatusBadge(subagent.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className="p-4 rounded-lg transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: "var(--card-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <div>
            <h4
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {subagent.task}
            </h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Parent: {subagent.parentName}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: `${statusInfo.color}20`,
            color: statusInfo.color,
          }}
        >
          <StatusIcon
            className={`w-3 h-3 ${subagent.status === "active" ? "animate-spin" : ""}`}
          />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Model */}
        <div className="flex items-center gap-2">
          <Cpu className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {subagent.model}
          </span>
        </div>

        {/* Age */}
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {formatDistanceToNow(new Date(subagent.startedAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Token usage */}
      <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" style={{ color: "var(--warning)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Tokens
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {formatTokens(subagent.tokens)}
            </span>
            {subagent.tokens > 0 && (
              <div className="flex gap-1">
                <span
                  className="text-xs px-1 rounded"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--text-muted)",
                  }}
                >
                  {formatTokens(subagent.inputTokens)} in
                </span>
                <span
                  className="text-xs px-1 rounded"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--text-muted)",
                  }}
                >
                  {formatTokens(subagent.outputTokens)} out
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for token usage */}
        {subagent.tokens > 0 && (
          <div
            className="mt-2 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  (subagent.outputTokens / subagent.tokens) * 100,
                  100
                )}%`,
                backgroundColor: "var(--accent)",
              }}
            />
          </div>
        )}
      </div>

      {/* Duration if available */}
      {subagent.duration && (
        <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Duration: {formatDuration(subagent.duration)}
        </div>
      )}
    </div>
  );
}

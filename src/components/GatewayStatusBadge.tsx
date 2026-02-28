"use client";

import { Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { useGatewayStatus } from "@/hooks/useGatewayStatus";

const statusConfig = {
  connected: {
    icon: Wifi,
    color: "var(--success)",
    bgColor: "rgba(34, 197, 94, 0.15)",
    label: "Connected",
  },
  disconnected: {
    icon: WifiOff,
    color: "var(--error)",
    bgColor: "rgba(239, 68, 68, 0.15)",
    label: "Disconnected",
  },
  error: {
    icon: WifiOff,
    color: "var(--warning)",
    bgColor: "rgba(245, 158, 11, 0.15)",
    label: "Error",
  },
};

export function GatewayStatusBadge() {
  const { status, loading, refresh } = useGatewayStatus();

  if (loading || !status) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "0.375rem",
          backgroundColor: "rgba(42, 42, 42, 0.5)",
        }}
      >
        <Loader2
          style={{
            width: "12px",
            height: "12px",
            animation: "spin 1s linear infinite",
            color: "var(--text-muted)",
          }}
        />
        <span
          style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}
        >
          Checking...
        </span>
      </div>
    );
  }

  const config = statusConfig[status.status];
  const Icon = config.icon;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.375rem",
        backgroundColor: config.bgColor,
        cursor: "pointer",
      }}
      onClick={refresh}
      title={`Gateway: ${config.label}${status.latency ? ` (${status.latency}ms)` : ""}\nPort: ${status.port}\nClick to refresh`}
    >
      <Icon style={{ width: "12px", height: "12px", color: config.color }} />
      <span
        style={{ fontSize: "0.625rem", fontWeight: 500, color: config.color }}
      >
        {config.label}
      </span>
      {status.latency !== null && (
        <span
          style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}
        >
          {status.latency}ms
        </span>
      )}
      <RefreshCw
        style={{
          width: "10px",
          height: "10px",
          color: "var(--text-muted)",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

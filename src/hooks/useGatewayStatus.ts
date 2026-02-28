import { useState, useEffect, useCallback } from "react";

interface GatewayStatus {
  status: "connected" | "disconnected" | "error";
  latency: number | null;
  port: number;
  lastChecked: string;
  error?: string;
}

export function useGatewayStatus(refreshInterval = 30000) {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/gateway/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        status: "disconnected",
        latency: null,
        port: 18789,
        lastChecked: new Date().toISOString(),
        error: "Failed to fetch",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, refreshInterval]);

  return { status, loading, refresh: fetchStatus };
}

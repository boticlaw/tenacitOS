"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import type { Activity } from "@/types/websocket";

interface UseActivityStreamOptions {
  enabled?: boolean;
  useWebSocket?: boolean; // Toggle between WebSocket and SSE
  onActivity?: (activity: Activity) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface ActivityStreamData {
  id: string;
  type: string;
  description: string;
  status: string;
  timestamp: string;
  [key: string]: unknown;
}

export function useActivityStreamHybrid(options: UseActivityStreamOptions = {}) {
  const { enabled = true, useWebSocket: preferWebSocket = true, onActivity, onConnect, onDisconnect } = options;

  const [activities, setActivities] = useState<ActivityStreamData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<"websocket" | "sse" | "none">("none");

  // WebSocket connection
  const ws = useWebSocket({
    channels: ["activities"],
    onConnect: (connectionId) => {
      setIsConnected(true);
      setError(null);
      setConnectionType("websocket");
      onConnect?.();
    },
    onDisconnect: (reason) => {
      setIsConnected(false);
      setConnectionType("none");
      onDisconnect?.();
    },
    onError: (err) => {
      setError(err);
    },
    onActivity: (data) => {
      if (data.action === "create" && data.activity) {
        const activity = data.activity as ActivityStreamData;
        setActivities((prev) => {
          const exists = prev.some((a) => a.id === activity.id);
          if (exists) return prev;
          return [activity, ...prev].slice(0, 100);
        });
        onActivity?.(activity as Activity);
      } else if (data.action === "batch" && data.activities) {
        const activities = data.activities as ActivityStreamData[];
        setActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newActivities = activities.filter((a) => !existingIds.has(a.id));
          return [...newActivities, ...prev].slice(0, 100);
        });
      }
    },
  });

  // SSE fallback
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) return;

    const eventSource = new EventSource("/api/activities/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      setConnectionType("sse");
      onConnect?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") return;

        if (data.type === "batch" && Array.isArray(data.activities)) {
          setActivities((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newActivities = data.activities.filter((a: ActivityStreamData) => !existingIds.has(a.id));
            return [...newActivities, ...prev].slice(0, 100);
          });
          return;
        }

        if (data.type === "new" && data.activity) {
          setActivities((prev) => {
            const exists = prev.some((a) => a.id === data.activity.id);
            if (exists) return prev;
            return [data.activity, ...prev].slice(0, 100);
          });
          onActivity?.(data.activity);
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setConnectionType("none");
      setError("Connection lost");
      onDisconnect?.();
      eventSource.close();
      eventSourceRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        setError("Reconnecting...");
        connectSSE();
      }, 3000);
    };
  }, [onActivity, onConnect, onDisconnect]);

  const disconnectSSE = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setConnectionType("none");
  }, []);

  // Toggle between WebSocket and SSE
  useEffect(() => {
    if (!enabled) {
      ws.disconnect();
      disconnectSSE();
      return;
    }

    if (preferWebSocket) {
      // Try WebSocket first
      ws.connect();
      
      // Fallback to SSE if WebSocket fails after timeout
      const timeout = setTimeout(() => {
        if (!ws.isConnected) {
          console.log("WebSocket connection failed, falling back to SSE");
          connectSSE();
        }
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      connectSSE();
    }

    return () => {
      disconnectSSE();
    };
  }, [enabled, preferWebSocket]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const reconnect = useCallback(() => {
    if (preferWebSocket) {
      ws.reconnect();
    } else {
      disconnectSSE();
      connectSSE();
    }
  }, [preferWebSocket, ws, disconnectSSE, connectSSE]);

  const disconnect = useCallback(() => {
    ws.disconnect();
    disconnectSSE();
  }, [ws, disconnectSSE]);

  return {
    activities,
    isConnected,
    error,
    connectionType,
    clearActivities,
    reconnect,
    disconnect,
    // Expose WebSocket stats if using WebSocket
    wsStats: ws.isConnected ? {
      latency: ws.latency,
      connectionId: ws.connectionId,
      messagesReceived: ws.messagesReceived,
      messagesSent: ws.messagesSent,
    } : null,
  };
}

// Backward-compatible export
export { useActivityStreamHybrid as useActivityStream };

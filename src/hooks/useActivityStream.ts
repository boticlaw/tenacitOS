import { useEffect, useRef, useState, useCallback } from "react";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
  [key: string]: unknown;
}

interface UseActivityStreamOptions {
  enabled?: boolean;
  onActivity?: (activity: Activity) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseActivityStreamReturn {
  activities: Activity[];
  isConnected: boolean;
  error: string | null;
  clearActivities: () => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useActivityStream(options: UseActivityStreamOptions = {}): UseActivityStreamReturn {
  const { enabled = true, onActivity, onConnect, onDisconnect } = options;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    const eventSource = new EventSource("/api/activities/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      onConnect?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          return;
        }

        if (data.type === "batch" && Array.isArray(data.activities)) {
          setActivities((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newActivities = data.activities.filter((a: Activity) => !existingIds.has(a.id));
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
      setError("Connection lost");
      onDisconnect?.();
      eventSource.close();
      eventSourceRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        setError("Reconnecting...");
        connect();
      }, 3000);
    };
  }, [enabled, onActivity, onConnect, onDisconnect]);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    activities,
    isConnected,
    error,
    clearActivities,
    reconnect: connect,
    disconnect,
  };
}

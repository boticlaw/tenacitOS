"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  ServerMessage,
  ClientMessage,
  WebSocketOptions,
  WebSocketStats,
  ConnectionState,
  WebSocketChannel,
  ActivityMessage,
  SessionMessage,
  NotificationMessage,
  StatusMessage,
} from "@/types/websocket";

const DEFAULT_OPTIONS: Required<
  Pick<
    WebSocketOptions,
    | "reconnect"
    | "reconnectInterval"
    | "reconnectMaxAttempts"
    | "reconnectBackoff"
    | "heartbeatInterval"
  >
> & { url: string } = {
  url: "/api/ws",
  reconnect: true,
  reconnectInterval: 1000,
  reconnectMaxAttempts: 10,
  reconnectBackoff: true,
  heartbeatInterval: 30000,
};

export function useWebSocket(options: WebSocketOptions = {}) {
  const {
    url = DEFAULT_OPTIONS.url,
    reconnect = DEFAULT_OPTIONS.reconnect,
    reconnectInterval = DEFAULT_OPTIONS.reconnectInterval,
    reconnectMaxAttempts = DEFAULT_OPTIONS.reconnectMaxAttempts,
    reconnectBackoff = DEFAULT_OPTIONS.reconnectBackoff,
    heartbeatInterval = DEFAULT_OPTIONS.heartbeatInterval,
    channels = [],
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    onActivity,
    onSession,
    onNotification,
    onStatus,
  } = options;

  const [stats, setStats] = useState<WebSocketStats>({
    connectionId: null,
    state: "disconnected",
    connectedAt: null,
    messagesReceived: 0,
    messagesSent: 0,
    latency: null,
    reconnectAttempts: 0,
    subscribedChannels: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Send message helper
  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      setStats((prev) => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
      return true;
    }
    return false;
  }, []);

  // Subscribe to channels
  const subscribe = useCallback(
    (newChannels: WebSocketChannel[]) => {
      const toSubscribe = newChannels.filter(
        (c) => !stats.subscribedChannels.includes(c)
      );
      if (toSubscribe.length > 0) {
        send({ type: "subscribe", channels: toSubscribe });
      }
    },
    [send, stats.subscribedChannels]
  );

  // Unsubscribe from channels
  const unsubscribe = useCallback(
    (channelsToRemove: WebSocketChannel[]) => {
      const toRemove = channelsToRemove.filter((c) =>
        stats.subscribedChannels.includes(c)
      );
      if (toRemove.length > 0) {
        send({ type: "unsubscribe", channels: toRemove });
      }
    },
    [send, stats.subscribedChannels]
  );

  // Send action (bidirectional)
  const sendAction = useCallback(
    (action: string, payload: Record<string, unknown>, id?: string) => {
      return send({ type: "action", id, action, payload });
    },
    [send]
  );

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    send({ type: "ping", timestamp: new Date().toISOString() });
  }, [send]);

  // Connect
  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    clearTimers();
    setStats((prev) => ({ ...prev, state: "connecting" }));

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}${url}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setStats((prev) => ({
          ...prev,
          state: "connected",
          connectedAt: new Date().toISOString(),
          reconnectAttempts: 0,
        }));

        // Subscribe to initial channels
        if (channels.length > 0) {
          send({ type: "subscribe", channels });
        }

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(
          sendHeartbeat,
          heartbeatInterval
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          setStats((prev) => ({
            ...prev,
            messagesReceived: prev.messagesReceived + 1,
          }));

          // Handle message types
          switch (message.type) {
            case "connected":
              setStats((prev) => ({
                ...prev,
                connectionId: message.connectionId,
              }));
              onConnect?.(message.connectionId);
              break;

            case "subscribed":
              setStats((prev) => ({
                ...prev,
                subscribedChannels: [
                  ...new Set([...prev.subscribedChannels, ...message.channels]),
                ],
              }));
              break;

            case "unsubscribed":
              setStats((prev) => ({
                ...prev,
                subscribedChannels: prev.subscribedChannels.filter(
                  (c) => !message.channels.includes(c)
                ),
              }));
              break;

            case "pong":
              setStats((prev) => ({
                ...prev,
                latency: message.latency,
              }));
              break;

            case "activity":
              onActivity?.((message as ActivityMessage).data);
              break;

            case "session":
              onSession?.((message as SessionMessage).data);
              break;

            case "notification":
              onNotification?.((message as NotificationMessage).data);
              break;

            case "status":
              onStatus?.((message as StatusMessage).data);
              break;

            case "error":
              onError?.(message.message);
              break;
          }

          onMessage?.(message);
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = (event) => {
        setStats((prev) => ({
          ...prev,
          state: "disconnected",
          connectionId: null,
          subscribedChannels: [],
        }));

        onDisconnect?.(event.reason || "Connection closed");

        // Attempt reconnection
        if (reconnect && reconnectAttemptsRef.current < reconnectMaxAttempts) {
          const delay = reconnectBackoff
            ? reconnectInterval * Math.pow(2, reconnectAttemptsRef.current)
            : reconnectInterval;

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            setStats((prev) => ({
              ...prev,
              reconnectAttempts: reconnectAttemptsRef.current,
            }));
            connect();
          }, Math.min(delay, 30000)); // Cap at 30s
        }
      };

      ws.onerror = () => {
        onError?.("WebSocket error");
      };
    } catch (error) {
      setStats((prev) => ({ ...prev, state: "disconnected" }));
      onError?.(error instanceof Error ? error.message : "Connection failed");
    }
  }, [
    url,
    channels,
    clearTimers,
    heartbeatInterval,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    onActivity,
    onSession,
    onNotification,
    onStatus,
    reconnect,
    reconnectMaxAttempts,
    reconnectInterval,
    reconnectBackoff,
    send,
    sendHeartbeat,
  ]);

  // Disconnect
  const disconnect = useCallback(() => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }
    setStats((prev) => ({
      ...prev,
      state: "disconnected",
      connectionId: null,
      subscribedChannels: [],
    }));
  }, [clearTimers]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    // Auto-connect
    connect();

    return () => {
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    ...stats,
    isConnected: stats.state === "connected",
    isConnecting: stats.state === "connecting",

    // Actions
    connect,
    disconnect,
    reconnect: connect,
    send,
    sendAction,
    subscribe,
    unsubscribe,
    sendHeartbeat,
  };
}

export type UseWebSocketReturn = ReturnType<typeof useWebSocket>;

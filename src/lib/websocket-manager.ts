/**
 * WebSocket Server Manager
 * Manages WebSocket connections for real-time updates
 * 
 * Note: For production with Next.js, this requires a custom server.
 * For serverless (Vercel), use SSE fallback via /api/ws/route.ts
 */

import type { IncomingMessage } from "http";
import type { Server as WebSocketServer, WebSocket as WSWebSocket } from "ws";
import type { ServerMessage, ClientMessage, WebSocketChannel } from "@/types/websocket";

export interface WebSocketClient {
  id: string;
  ws: WSWebSocket;
  channels: Set<WebSocketChannel>;
  connectedAt: Date;
  lastPing: Date;
  isAlive: boolean;
}

export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private wss: WebSocketServer | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private activityPollInterval: NodeJS.Timeout | null = null;
  private lastActivityId: string | null = null;

  constructor() {
    // Singleton pattern
  }

  /**
   * Initialize the WebSocket server
   */
  init(wss: WebSocketServer) {
    if (this.wss) return;
    this.wss = wss;

    wss.on("connection", (ws, request) => {
      this.handleConnection(ws, request);
    });

    // Heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client.id);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);

    // Activity polling (similar to SSE implementation)
    this.startActivityPolling();
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WSWebSocket, request: IncomingMessage) {
    const connectionId = this.generateConnectionId();
    const client: WebSocketClient = {
      id: connectionId,
      ws,
      channels: new Set(),
      connectedAt: new Date(),
      lastPing: new Date(),
      isAlive: true,
    };

    this.clients.set(connectionId, client);

    // Send connected message
    this.sendToClient(client, {
      type: "connected",
      timestamp: new Date().toISOString(),
      connectionId,
      serverTime: new Date().toISOString(),
    });

    // Handle pong (heartbeat response)
    ws.on("pong", () => {
      client.isAlive = true;
      client.lastPing = new Date();
    });

    // Handle incoming messages
    ws.on("message", (data) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        this.handleMessage(client, message);
      } catch (error) {
        this.sendError(client, "PARSE_ERROR", "Invalid message format");
      }
    });

    // Handle close
    ws.on("close", () => {
      this.clients.delete(connectionId);
    });

    // Handle error
    ws.on("error", (error) => {
      console.error(`WebSocket error for client ${connectionId}:`, error);
      this.clients.delete(connectionId);
    });
  }

  /**
   * Handle incoming client message
   */
  private handleMessage(client: WebSocketClient, message: ClientMessage) {
    switch (message.type) {
      case "subscribe":
        message.channels.forEach((ch) => client.channels.add(ch as WebSocketChannel));
        this.sendToClient(client, {
          type: "subscribed",
          timestamp: new Date().toISOString(),
          channels: message.channels,
        });
        break;

      case "unsubscribe":
        message.channels.forEach((ch) => client.channels.delete(ch as WebSocketChannel));
        this.sendToClient(client, {
          type: "unsubscribed",
          timestamp: new Date().toISOString(),
          channels: message.channels,
        });
        break;

      case "ping":
        const clientTimestamp = message.timestamp;
        const latency = Date.now() - new Date(clientTimestamp).getTime();
        this.sendToClient(client, {
          type: "pong",
          timestamp: new Date().toISOString(),
          clientTimestamp,
          latency: Math.max(0, latency),
        });
        break;

      case "action":
        this.handleAction(client, message);
        break;
    }
  }

  /**
   * Handle action messages (bidirectional communication)
   */
  private handleAction(
    client: WebSocketClient,
    message: { action: string; payload: Record<string, unknown>; id?: string }
  ) {
    // Process known actions
    switch (message.action) {
      case "mark_notification_read":
        // Handle notification read action
        this.sendActionResult(client, message.id || "", true, { marked: true });
        break;

      case "refresh_activities":
        // Client requests activity refresh
        this.broadcastToChannel("activities", {
          type: "status",
          timestamp: new Date().toISOString(),
          data: {
            component: "activities",
            status: "online",
            message: "Refresh requested",
          },
        });
        break;

      default:
        this.sendError(client, "UNKNOWN_ACTION", `Unknown action: ${message.action}`);
    }
  }

  /**
   * Start polling for activities (mirrors SSE behavior)
   */
  private startActivityPolling() {
    // Import dynamically to avoid circular deps
    this.activityPollInterval = setInterval(async () => {
      try {
        const { getActivities } = await import("@/lib/activities-db");
        const result = getActivities({ limit: 10, sort: "newest" });
        const activities = result.activities;

        if (activities.length > 0) {
          const newest = activities[0];

          if (this.lastActivityId === null) {
            this.lastActivityId = newest.id;
          } else if (newest.id !== this.lastActivityId) {
            // Broadcast new activity
            this.broadcastToChannel("activities", {
              type: "activity",
              timestamp: new Date().toISOString(),
              data: {
                id: newest.id,
                action: "create",
                activity: newest,
              },
            });
            this.lastActivityId = newest.id;
          }
        }
      } catch (error) {
        console.error("Error polling activities:", error);
      }
    }, 2000);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocketClient, message: ServerMessage) {
    if (client.ws.readyState === 1) {
      // WebSocket.OPEN
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send action result to client
   */
  private sendActionResult(
    client: WebSocketClient,
    requestId: string,
    success: boolean,
    result?: unknown
  ) {
    this.sendToClient(client, {
      type: "action_result",
      timestamp: new Date().toISOString(),
      requestId,
      success,
      result,
    });
  }

  /**
   * Send error to client
   */
  private sendError(client: WebSocketClient, code: string, message: string, details?: unknown) {
    this.sendToClient(client, {
      type: "error",
      timestamp: new Date().toISOString(),
      code,
      message,
      details,
    });
  }

  /**
   * Broadcast message to all clients subscribed to a channel
   */
  broadcastToChannel(channel: WebSocketChannel, message: ServerMessage) {
    this.clients.forEach((client) => {
      if (client.channels.has(channel)) {
        this.sendToClient(client, message);
      }
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(message: ServerMessage) {
    this.clients.forEach((client) => {
      this.sendToClient(client, message);
    });
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stats about current connections
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      channels: Array.from(
        new Set(
          Array.from(this.clients.values()).flatMap((c) => Array.from(c.channels))
        )
      ),
      clients: Array.from(this.clients.values()).map((c) => ({
        id: c.id,
        channels: Array.from(c.channels),
        connectedAt: c.connectedAt.toISOString(),
        isAlive: c.isAlive,
      })),
    };
  }

  /**
   * Cleanup and close all connections
   */
  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.activityPollInterval) {
      clearInterval(this.activityPollInterval);
    }
    this.clients.forEach((client) => {
      client.ws.close(1001, "Server shutting down");
    });
    this.clients.clear();
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

/**
 * WebSocket-compatible real-time stream via SSE
 * GET /api/ws
 * 
 * This provides a WebSocket-like experience using Server-Sent Events
 * which works on serverless platforms (Vercel).
 * 
 * For full WebSocket support with bidirectional communication,
 * deploy with a custom Node.js server.
 */

import { NextRequest } from "next/server";
import { getActivities } from "@/lib/activities-db";

interface ClientState {
  connectionId: string;
  channels: Set<string>;
  lastActivityId: string | null;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let closed = false;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const state: ClientState = {
    connectionId: generateConnectionId(),
    channels: new Set(["activities", "sessions", "status"]),
    lastActivityId: null,
  };

  // Parse requested channels from query
  const url = new URL(request.url);
  const channelsParam = url.searchParams.get("channels");
  if (channelsParam) {
    state.channels = new Set(channelsParam.split(",").filter(Boolean));
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send connected message
      send({
        type: "connected",
        timestamp: new Date().toISOString(),
        connectionId: state.connectionId,
        serverTime: new Date().toISOString(),
      });

      // Send subscribed confirmation
      send({
        type: "subscribed",
        timestamp: new Date().toISOString(),
        channels: Array.from(state.channels),
      });

      // Heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        send({ type: "heartbeat", timestamp: new Date().toISOString() });
      }, 15000);

      // Main polling loop
      const poll = async () => {
        if (closed) return;

        try {
          // Poll activities if subscribed
          if (state.channels.has("activities")) {
            const result = getActivities({ limit: 10, sort: "newest" });
            const activities = result.activities;

            if (activities.length > 0) {
              const newest = activities[0];

              if (state.lastActivityId === null) {
                // First run: send recent batch
                send({
                  type: "activity",
                  timestamp: new Date().toISOString(),
                  data: {
                    action: "batch",
                    activities: activities.slice(0, 5),
                  },
                });
                state.lastActivityId = newest.id;
              } else if (newest.id !== state.lastActivityId) {
                // New activity detected
                send({
                  type: "activity",
                  timestamp: new Date().toISOString(),
                  data: {
                    id: newest.id,
                    action: "create",
                    activity: newest,
                  },
                });
                state.lastActivityId = newest.id;
              }
            }
          }

          // Poll sessions if subscribed (placeholder - would need actual session store)
          if (state.channels.has("sessions")) {
            // Session changes would be detected here
            // For now, just send periodic status
          }

          // Send status update
          if (state.channels.has("status")) {
            send({
              type: "status",
              timestamp: new Date().toISOString(),
              data: {
                component: "ws-proxy",
                status: "online",
                metrics: {
                  connections: 1,
                  uptime: process.uptime(),
                },
              },
            });
          }
        } catch (error) {
          console.error("Polling error:", error);
        }

        if (!closed) {
          setTimeout(poll, 2000);
        }
      };

      // Start polling
      poll();

      // Handle client disconnect
      request.signal?.addEventListener("abort", () => {
        closed = true;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Generate unique connection ID
 */
function generateConnectionId(): string {
  return `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * POST handler for bidirectional actions
 * Allows clients to send actions via POST while receiving updates via SSE
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload, id } = body;

    // Handle known actions
    switch (action) {
      case "subscribe": {
        // Client wants to subscribe to channels
        // In SSE mode, this just returns success (channels are query params)
        return Response.json({
          success: true,
          message: "Use query params ?channels=activities,sessions for SSE",
        });
      }

      case "ping": {
        const latency = Date.now() - new Date(body.timestamp).getTime();
        return Response.json({
          type: "pong",
          timestamp: new Date().toISOString(),
          latency: Math.max(0, latency),
        });
      }

      case "mark_notification_read": {
        // Handle notification read
        return Response.json({
          success: true,
          action: "mark_notification_read",
          result: { marked: true, notificationId: payload?.notificationId },
        });
      }

      case "refresh_activities": {
        // Return latest activities
        const result = getActivities({ limit: 10, sort: "newest" });
        return Response.json({
          success: true,
          action: "refresh_activities",
          result: result,
        });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return Response.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

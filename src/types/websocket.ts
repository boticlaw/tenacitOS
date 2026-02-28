// WebSocket message types for real-time communication

// Client -> Server messages
export type ClientMessageType =
  | "subscribe"
  | "unsubscribe"
  | "ping"
  | "action";

export interface BaseClientMessage {
  type: ClientMessageType;
  id?: string; // For request-response correlation
}

export interface SubscribeMessage extends BaseClientMessage {
  type: "subscribe";
  channels: string[]; // e.g., ["activities", "sessions", "notifications"]
}

export interface UnsubscribeMessage extends BaseClientMessage {
  type: "unsubscribe";
  channels: string[];
}

export interface PingMessage extends BaseClientMessage {
  type: "ping";
  timestamp: string;
}

export interface ActionMessage extends BaseClientMessage {
  type: "action";
  action: string;
  payload: Record<string, unknown>;
}

export type ClientMessage = SubscribeMessage | UnsubscribeMessage | PingMessage | ActionMessage;

// Server -> Client messages
export type ServerMessageType =
  | "connected"
  | "subscribed"
  | "unsubscribed"
  | "pong"
  | "activity"
  | "session"
  | "notification"
  | "status"
  | "action_result"
  | "error";

export interface BaseServerMessage {
  type: ServerMessageType;
  timestamp: string;
}

export interface ConnectedMessage extends BaseServerMessage {
  type: "connected";
  connectionId: string;
  serverTime: string;
}

export interface SubscribedMessage extends BaseServerMessage {
  type: "subscribed";
  channels: string[];
}

export interface UnsubscribedMessage extends BaseServerMessage {
  type: "unsubscribed";
  channels: string[];
}

export interface PongMessage extends BaseServerMessage {
  type: "pong";
  clientTimestamp: string;
  latency: number; // ms
}

export interface ActivityMessage extends BaseServerMessage {
  type: "activity";
  data: {
    id: string;
    action: "create" | "update" | "delete";
    activity: {
      id: string;
      type: string;
      description: string;
      status: string;
      timestamp: string;
      [key: string]: unknown;
    };
  };
}

export interface SessionMessage extends BaseServerMessage {
  type: "session";
  data: {
    action: "create" | "update" | "delete" | "model_change";
    session: {
      key: string;
      model?: string;
      status?: string;
      [key: string]: unknown;
    };
  };
}

export interface NotificationMessage extends BaseServerMessage {
  type: "notification";
  data: {
    action: "create" | "read" | "delete";
    notification: {
      id: string;
      title: string;
      body?: string;
      priority?: "low" | "medium" | "high";
      read?: boolean;
      timestamp: string;
      [key: string]: unknown;
    };
  };
}

export interface StatusMessage extends BaseServerMessage {
  type: "status";
  data: {
    component: string;
    status: "online" | "offline" | "error";
    message?: string;
    metrics?: Record<string, number>;
  };
}

export interface ActionResultMessage extends BaseServerMessage {
  type: "action_result";
  requestId: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface ErrorMessage extends BaseServerMessage {
  type: "error";
  code: string;
  message: string;
  details?: unknown;
}

export type ServerMessage =
  | ConnectedMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | PongMessage
  | ActivityMessage
  | SessionMessage
  | NotificationMessage
  | StatusMessage
  | ActionResultMessage
  | ErrorMessage;

// Channel types for subscriptions
export type WebSocketChannel =
  | "activities"
  | "sessions"
  | "notifications"
  | "status"
  | "gateway"
  | "cron"
  | "agents";

// Connection state
export type ConnectionState = "connecting" | "connected" | "disconnecting" | "disconnected";

// WebSocket options
export interface WebSocketOptions {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectMaxAttempts?: number;
  reconnectBackoff?: boolean;
  heartbeatInterval?: number;
  channels?: WebSocketChannel[];
  onConnect?: (connectionId: string) => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
  onMessage?: (message: ServerMessage) => void;
  onActivity?: (data: ActivityMessage["data"]) => void;
  onSession?: (data: SessionMessage["data"]) => void;
  onNotification?: (data: NotificationMessage["data"]) => void;
  onStatus?: (data: StatusMessage["data"]) => void;
}

// WebSocket stats
export interface WebSocketStats {
  connectionId: string | null;
  state: ConnectionState;
  connectedAt: string | null;
  messagesReceived: number;
  messagesSent: number;
  latency: number | null;
  reconnectAttempts: number;
  subscribedChannels: string[];
}

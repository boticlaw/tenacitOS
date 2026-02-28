// Type-safe event definitions for runtime event bridge

export type EventType = 
  | "activity:update"
  | "activity:create"
  | "session:change"
  | "session:create"
  | "session:delete"
  | "notification:new"
  | "notification:read"
  | "status:change"
  | "gateway:status"
  | "model:change";

export interface BaseEvent {
  type: EventType;
  timestamp: string;
  source?: string;
}

export interface ActivityUpdateEvent extends BaseEvent {
  type: "activity:update";
  payload: {
    activityId: string;
    status: "success" | "error" | "pending";
    updates: Record<string, unknown>;
  };
}

export interface ActivityCreateEvent extends BaseEvent {
  type: "activity:create";
  payload: {
    activityId: string;
    type: string;
    description: string;
  };
}

export interface SessionChangeEvent extends BaseEvent {
  type: "session:change";
  payload: {
    sessionKey: string;
    changes: Record<string, unknown>;
  };
}

export interface SessionCreateEvent extends BaseEvent {
  type: "session:create";
  payload: {
    sessionKey: string;
    type: string;
    model: string;
  };
}

export interface SessionDeleteEvent extends BaseEvent {
  type: "session:delete";
  payload: {
    sessionKey: string;
  };
}

export interface NotificationNewEvent extends BaseEvent {
  type: "notification:new";
  payload: {
    notificationId: string;
    title: string;
    body: string;
    priority: "low" | "medium" | "high";
  };
}

export interface NotificationReadEvent extends BaseEvent {
  type: "notification:read";
  payload: {
    notificationId: string;
  };
}

export interface StatusChangeEvent extends BaseEvent {
  type: "status:change";
  payload: {
    component: string;
    status: "online" | "offline" | "error";
    message?: string;
  };
}

export interface GatewayStatusEvent extends BaseEvent {
  type: "gateway:status";
  payload: {
    status: "connected" | "disconnected" | "error";
    latency?: number;
    port?: number;
  };
}

export interface ModelChangeEvent extends BaseEvent {
  type: "model:change";
  payload: {
    sessionKey: string;
    oldModel: string;
    newModel: string;
  };
}

export type RuntimeEvent =
  | ActivityUpdateEvent
  | ActivityCreateEvent
  | SessionChangeEvent
  | SessionCreateEvent
  | SessionDeleteEvent
  | NotificationNewEvent
  | NotificationReadEvent
  | StatusChangeEvent
  | GatewayStatusEvent
  | ModelChangeEvent;

export type EventHandler<T extends RuntimeEvent = RuntimeEvent> = (event: T) => void;

export type EventFilter = {
  types?: EventType[];
  source?: string;
};

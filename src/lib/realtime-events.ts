/**
 * Realtime Events System - Type-safe bidirectional events
 * 
 * This module provides a WebSocket-like experience over SSE + POST,
 * enabling bidirectional communication in Next.js App Router.
 */

// Event types that can be sent FROM server TO client
export type ServerEventType =
  | 'connected'
  | 'activity:new'
  | 'activity:updated'
  | 'activity:deleted'
  | 'agent:status'
  | 'agent:mood'
  | 'session:started'
  | 'session:ended'
  | 'subagent:spawned'
  | 'subagent:completed'
  | 'notification:new'
  | 'system:alert'
  | 'cron:started'
  | 'cron:completed'
  | 'cron:failed'
  | 'heartbeat:ping'
  | 'gateway:status'
  | 'queue:updated';

// Event types that can be sent FROM client TO server
export type ClientEventType =
  | 'subscribe'
  | 'unsubscribe'
  | 'ping'
  | 'action:approve'
  | 'action:reject'
  | 'agent:pause'
  | 'agent:resume'
  | 'session:cancel';

// Base event structure
export interface RealtimeEvent<T = unknown> {
  type: ServerEventType | ClientEventType;
  payload: T;
  timestamp: string;
  id: string;
}

// Specific event payloads
export interface ActivityNewPayload {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
  duration?: number;
  tokens_used?: number;
}

export interface AgentStatusPayload {
  agentId: string;
  status: 'working' | 'idle' | 'error' | 'paused';
  currentTask?: string;
  lastActivity?: string;
}

export interface AgentMoodPayload {
  agentId: string;
  mood: 'productive' | 'busy' | 'frustrated' | 'content' | 'tired';
  emoji: string;
  streak: number;
  energyLevel: number;
}

export interface SubagentPayload {
  sessionId: string;
  parentId: string;
  task: string;
  model: string;
  status: 'running' | 'completed' | 'failed';
  tokensUsed?: number;
}

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
}

export interface SystemAlertPayload {
  level: 'info' | 'warning' | 'critical';
  message: string;
  source: string;
  action?: string;
}

export interface CronEventPayload {
  jobId: string;
  jobName: string;
  runId: string;
  output?: string;
  error?: string;
  duration?: number;
}

export interface GatewayStatusPayload {
  connected: boolean;
  latency?: number;
  version?: string;
  uptime?: number;
}

export interface QueueUpdatedPayload {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

// Client action payloads
export interface SubscribePayload {
  channels: string[];
}

export interface ActionApprovePayload {
  activityId: string;
  notes?: string;
}

export interface ActionRejectPayload {
  activityId: string;
  reason?: string;
}

export interface AgentControlPayload {
  agentId: string;
}

// Event map for type safety
export interface ServerEventMap {
  'connected': { clientId: string; serverTime: string };
  'activity:new': ActivityNewPayload;
  'activity:updated': ActivityNewPayload;
  'activity:deleted': { id: string };
  'agent:status': AgentStatusPayload;
  'agent:mood': AgentMoodPayload;
  'session:started': { sessionId: string; type: string; model: string };
  'session:ended': { sessionId: string; duration: number; tokens: number };
  'subagent:spawned': SubagentPayload;
  'subagent:completed': SubagentPayload;
  'notification:new': NotificationPayload;
  'system:alert': SystemAlertPayload;
  'cron:started': CronEventPayload;
  'cron:completed': CronEventPayload;
  'cron:failed': CronEventPayload;
  'heartbeat:ping': { timestamp: string };
  'gateway:status': GatewayStatusPayload;
  'queue:updated': QueueUpdatedPayload;
}

export interface ClientEventMap {
  'subscribe': SubscribePayload;
  'unsubscribe': SubscribePayload;
  'ping': {};
  'action:approve': ActionApprovePayload;
  'action:reject': ActionRejectPayload;
  'agent:pause': AgentControlPayload;
  'agent:resume': AgentControlPayload;
  'session:cancel': { sessionId: string };
}

// Helper to generate unique event IDs
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create a typed event
export function createEvent<K extends keyof ServerEventMap>(
  type: K,
  payload: ServerEventMap[K]
): RealtimeEvent<ServerEventMap[K]> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
  };
}

// Channel names for subscription management
export const CHANNELS = {
  ACTIVITIES: 'activities',
  AGENTS: 'agents',
  SESSIONS: 'sessions',
  SUBAGENTS: 'subagents',
  NOTIFICATIONS: 'notifications',
  SYSTEM: 'system',
  CRON: 'cron',
  GATEWAY: 'gateway',
  QUEUE: 'queue',
} as const;

export type ChannelName = typeof CHANNELS[keyof typeof CHANNELS];

/**
 * Activity Operations Layer
 * Pure functions for activity management with validation and error handling
 */

import { randomUUID } from "crypto";

// Types
export type ActivityType =
  | "file"
  | "search"
  | "message"
  | "command"
  | "security"
  | "build"
  | "task"
  | "cron"
  | "cron_run"
  | "file_read"
  | "file_write"
  | "web_search"
  | "message_sent"
  | "tool_call"
  | "agent_action"
  | "approval";

export type ActivityStatus = "success" | "error" | "pending" | "running" | "approved" | "rejected";

export interface Activity {
  id: string;
  timestamp: string;
  type: ActivityType;
  description: string;
  status: ActivityStatus;
  duration_ms?: number | null;
  tokens_used?: number | null;
  agent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreateActivityInput {
  type: ActivityType;
  description: string;
  status?: ActivityStatus;
  duration_ms?: number | null;
  tokens_used?: number | null;
  agent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateActivityInput {
  id: string;
  status?: ActivityStatus;
  duration_ms?: number;
  tokens_used?: number;
  metadata?: Record<string, unknown>;
}

export interface ApproveActivityInput {
  id: string;
  approved: boolean;
  approver?: string;
  notes?: string;
}

export interface GetActivitiesInput {
  type?: string;
  status?: string;
  agent?: string;
  startDate?: string;
  endDate?: string;
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
}

export interface ActivitiesResult {
  activities: Activity[];
  total: number;
  hasMore: boolean;
}

// Validation
const VALID_TYPES: ActivityType[] = [
  "file", "search", "message", "command", "security", "build",
  "task", "cron", "cron_run", "file_read", "file_write",
  "web_search", "message_sent", "tool_call", "agent_action", "approval"
];

const VALID_STATUSES: ActivityStatus[] = [
  "success", "error", "pending", "running", "approved", "rejected"
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateActivityType(type: string): ValidationResult {
  const errors: string[] = [];
  
  if (!type) {
    errors.push("Activity type is required");
  } else if (!VALID_TYPES.includes(type as ActivityType)) {
    errors.push(`Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateActivityStatus(status: string): ValidationResult {
  const errors: string[] = [];
  
  if (!status) {
    errors.push("Status is required");
  } else if (!VALID_STATUSES.includes(status as ActivityStatus)) {
    errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateCreateActivity(input: CreateActivityInput): ValidationResult {
  const errors: string[] = [];

  const typeResult = validateActivityType(input.type);
  errors.push(...typeResult.errors);

  if (!input.description?.trim()) {
    errors.push("Description is required");
  } else if (input.description.length > 1000) {
    errors.push("Description must be less than 1000 characters");
  }

  if (input.status) {
    const statusResult = validateActivityStatus(input.status);
    errors.push(...statusResult.errors);
  }

  if (input.duration_ms !== undefined && input.duration_ms !== null && input.duration_ms < 0) {
    errors.push("Duration must be a positive number");
  }

  if (input.tokens_used !== undefined && input.tokens_used !== null && input.tokens_used < 0) {
    errors.push("Tokens used must be a positive number");
  }

  return { valid: errors.length === 0, errors };
}

// Operations (these call the database layer but add validation and business logic)
export async function createActivity(
  input: CreateActivityInput
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  // Validate
  const validation = validateCreateActivity(input);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  try {
    // Dynamic import to avoid circular deps
    const { logActivity } = await import("@/lib/activities-db");
    
    const activity = logActivity(input.type, input.description, input.status || "success", {
      duration_ms: input.duration_ms ?? null,
      tokens_used: input.tokens_used ?? null,
      agent: input.agent ?? null,
      metadata: input.metadata ?? null,
    });

    return { success: true, data: activity as Activity };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create activity" 
    };
  }
}

export async function updateActivity(
  input: UpdateActivityInput
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  if (!input.id) {
    return { success: false, error: "Activity ID is required" };
  }

  if (input.status) {
    const validation = validateActivityStatus(input.status);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join("; ") };
    }
  }

  try {
    const { updateActivity: dbUpdate, getActivityById } = await import("@/lib/activities-db");
    
    // Check activity exists
    const existing = getActivityById(input.id);
    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    dbUpdate(input.id, input.status || existing.status, {
      duration_ms: input.duration_ms,
      tokens_used: input.tokens_used,
    });

    const updated = getActivityById(input.id);
    return { success: true, data: updated as Activity };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update activity" 
    };
  }
}

export async function approveActivity(
  input: ApproveActivityInput
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  if (!input.id) {
    return { success: false, error: "Activity ID is required" };
  }

  try {
    const { updateActivityStatus, getActivityById } = await import("@/lib/activities-db");
    
    const existing = getActivityById(input.id);
    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    if (existing.type !== "approval") {
      return { success: false, error: "Only approval activities can be approved/rejected" };
    }

    const newStatus = input.approved ? "approved" : "rejected";
    const metadata = {
      ...existing.metadata as Record<string, unknown>,
      approved: input.approved,
      approver: input.approver,
      notes: input.notes,
      approvedAt: new Date().toISOString(),
    };

    updateActivityStatus(input.id, newStatus, metadata);

    const updated = getActivityById(input.id);
    return { success: true, data: updated as Activity };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to approve activity" 
    };
  }
}

export async function getActivities(
  input: GetActivitiesInput = {}
): Promise<{ success: boolean; data?: ActivitiesResult; error?: string }> {
  try {
    const { getActivities: dbGetActivities } = await import("@/lib/activities-db");
    
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;
    
    const result = dbGetActivities({
      type: input.type,
      status: input.status,
      agent: input.agent,
      startDate: input.startDate,
      endDate: input.endDate,
      sort: input.sort || "newest",
      limit,
      offset,
    });

    return {
      success: true,
      data: {
        activities: result.activities as Activity[],
        total: result.total,
        hasMore: offset + limit < result.total,
      },
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get activities" 
    };
  }
}

export async function getActivityStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    today: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const { getActivityStats: dbGetStats } = await import("@/lib/activities-db");
    const stats = dbGetStats();
    return { success: true, data: stats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get activity stats" 
    };
  }
}

// Type alias mapping for legacy support
export const ACTIVITY_TYPE_ALIASES: Record<string, string[]> = {
  cron: ["cron", "cron_run"],
  file: ["file", "file_read", "file_write"],
  search: ["search", "web_search"],
  message: ["message", "message_sent"],
  task: ["task", "tool_call", "agent_action"],
};

/**
 * Session Operations Layer
 * Pure functions for session management with validation and error handling
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Types
export type SessionType = "main" | "cron" | "subagent" | "direct" | "unknown";

export interface Session {
  id: string;
  key: string;
  type: SessionType;
  typeLabel: string;
  typeEmoji: string;
  sessionId: string | null;
  cronJobId?: string;
  subagentId?: string;
  updatedAt: number;
  ageMs: number;
  model: string;
  modelProvider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  contextTokens: number;
  contextUsedPercent: number | null;
  aborted: boolean;
}

export interface SessionMessage {
  id: string;
  type: "user" | "assistant" | "tool_use" | "tool_result" | "model_change" | "system";
  role?: string;
  content: string;
  timestamp: string;
  model?: string;
  toolName?: string;
}

export interface SessionWithMessages extends Session {
  messages: SessionMessage[];
  messageCount: number;
}

export interface ListSessionsInput {
  type?: SessionType;
  model?: string;
  limit?: number;
  offset?: number;
}

export interface GetSessionInput {
  sessionId: string;
}

export interface ChangeModelInput {
  sessionKey: string;
  newModel: string;
}

export interface ArchiveSessionInput {
  sessionKey: string;
}

// Validation
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSessionId(sessionId: string): ValidationResult {
  const errors: string[] = [];

  if (!sessionId) {
    errors.push("Session ID is required");
  } else if (!/^[a-f0-9-]{36}$/.test(sessionId)) {
    errors.push("Invalid session ID format (expected UUID)");
  }

  return { valid: errors.length === 0, errors };
}

export function validateModel(model: string): ValidationResult {
  const errors: string[] = [];

  if (!model) {
    errors.push("Model is required");
  } else if (model.length > 100) {
    errors.push("Model name too long");
  }

  return { valid: errors.length === 0, errors };
}

export function validateSessionKey(key: string): ValidationResult {
  const errors: string[] = [];

  if (!key) {
    errors.push("Session key is required");
  } else if (!key.startsWith("agent:")) {
    errors.push("Invalid session key format");
  }

  return { valid: errors.length === 0, errors };
}

// Operations
export async function listSessions(
  input: ListSessionsInput = {}
): Promise<{ success: boolean; data?: Session[]; total?: number; error?: string }> {
  try {
    const output = execSync("openclaw sessions list --json 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });

    const data = JSON.parse(output);
    const rawSessions = data.sessions || [];

    let sessions: Session[] = rawSessions
      .map(parseRawSession)
      .filter((s): s is Session => s !== null && s.type !== "unknown");

    // Filter by type
    if (input.type && input.type !== "unknown") {
      sessions = sessions.filter((s) => s.type === input.type);
    }

    // Filter by model
    if (input.model) {
      sessions = sessions.filter((s) => s.model.includes(input.model!));
    }

    // Sort by updatedAt desc
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    const total = sessions.length;

    // Apply pagination
    if (input.offset || input.limit) {
      const offset = input.offset ?? 0;
      const limit = input.limit ?? sessions.length;
      sessions = sessions.slice(offset, offset + limit);
    }

    return { success: true, data: sessions, total };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list sessions",
    };
  }
}

export async function getSession(
  input: GetSessionInput
): Promise<{ success: boolean; data?: SessionWithMessages; error?: string }> {
  const validation = validateSessionId(input.sessionId);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  try {
    const OPENCLAW_DIR = process.env.OPENCLAW_DIR || "/root/.openclaw";
    const sessionsDir = join(OPENCLAW_DIR, "agents", "main", "sessions");
    const filePath = join(sessionsDir, `${input.sessionId}.jsonl`);

    if (!existsSync(filePath)) {
      return { success: false, error: "Session not found" };
    }

    const raw = readFileSync(filePath, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);

    const messages: SessionMessage[] = [];
    let currentModel = "";

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);

        if (obj.type === "model_change" && obj.modelId) {
          currentModel = obj.modelId;
        }

        if (obj.type !== "message" || !obj.message) continue;

        const msg = obj.message;
        const role = msg.role;
        const timestamp = obj.timestamp || new Date().toISOString();

        if (typeof msg.content === "string") {
          messages.push({
            id: obj.id || Math.random().toString(),
            type: role === "user" ? "user" : "assistant",
            role,
            content: msg.content,
            timestamp,
            model: currentModel || undefined,
          });
        } else if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "text" && block.text) {
              messages.push({
                id: (obj.id || "") + "-text",
                type: role === "user" ? "user" : "assistant",
                role,
                content: block.text,
                timestamp,
                model: currentModel || undefined,
              });
            } else if (block.type === "tool_use" && block.name) {
              messages.push({
                id: block.id || (obj.id || "") + "-tool",
                type: "tool_use",
                role,
                content: `${block.name}(${block.input ? JSON.stringify(block.input).slice(0, 200) : ""})`,
                timestamp,
                toolName: block.name,
                model: currentModel || undefined,
              });
            } else if (block.type === "tool_result") {
              const resultContent = Array.isArray(block.text)
                ? block.text.map((b: { type: string; text?: string }) => b.text || "").join("\n")
                : (block.text as string) || "";
              messages.push({
                id: (obj.id || "") + "-result",
                type: "tool_result",
                role,
                content: resultContent.slice(0, 500),
                timestamp,
                model: currentModel || undefined,
              });
            }
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    // Get session info
    const allSessions = await listSessions();
    const sessionInfo = allSessions.data?.find((s) => s.sessionId === input.sessionId);

    const result: SessionWithMessages = {
      ...(sessionInfo || createDefaultSession(input.sessionId)),
      messages,
      messageCount: messages.length,
    };

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get session",
    };
  }
}

export async function changeModel(
  input: ChangeModelInput
): Promise<{ success: boolean; error?: string }> {
  const keyValidation = validateSessionKey(input.sessionKey);
  if (!keyValidation.valid) {
    return { success: false, error: keyValidation.errors.join("; ") };
  }

  const modelValidation = validateModel(input.newModel);
  if (!modelValidation.valid) {
    return { success: false, error: modelValidation.errors.join("; ") };
  }

  try {
    execSync(
      `openclaw session model ${input.sessionKey} ${input.newModel} 2>/dev/null`,
      {
        timeout: 10000,
        encoding: "utf-8",
      }
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change model",
    };
  }
}

export async function archiveSession(
  input: ArchiveSessionInput
): Promise<{ success: boolean; error?: string }> {
  const validation = validateSessionKey(input.sessionKey);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  try {
    execSync(`openclaw session archive ${input.sessionKey} 2>/dev/null`, {
      timeout: 10000,
      encoding: "utf-8",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive session",
    };
  }
}

// Helper functions
function parseRawSession(raw: {
  key: string;
  kind: string;
  updatedAt: number;
  ageMs: number;
  sessionId?: string;
  model?: string;
  modelProvider?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  contextTokens?: number;
  abortedLastRun?: boolean;
}): Session | null {
  const parsed = parseSessionKey(raw.key);

  // Skip run-entry duplicates
  if (parsed.isRunEntry) return null;

  const totalTokens = raw.totalTokens || 0;
  const contextTokens = raw.contextTokens || 0;
  const contextUsedPercent =
    contextTokens > 0 ? Math.round((totalTokens / contextTokens) * 100) : null;

  return {
    id: raw.key,
    key: raw.key,
    type: parsed.type,
    typeLabel: parsed.typeLabel,
    typeEmoji: parsed.typeEmoji,
    sessionId: raw.sessionId || null,
    cronJobId: parsed.cronJobId,
    subagentId: parsed.subagentId,
    updatedAt: raw.updatedAt,
    ageMs: raw.ageMs,
    model: raw.model || "unknown",
    modelProvider: raw.modelProvider || "anthropic",
    inputTokens: raw.inputTokens || 0,
    outputTokens: raw.outputTokens || 0,
    totalTokens,
    contextTokens,
    contextUsedPercent,
    aborted: raw.abortedLastRun || false,
  };
}

function parseSessionKey(key: string): {
  type: SessionType;
  typeLabel: string;
  typeEmoji: string;
  cronJobId?: string;
  subagentId?: string;
  isRunEntry: boolean;
} {
  const parts = key.split(":");

  if (parts.includes("run")) {
    return { type: "unknown", typeLabel: "Run Entry", typeEmoji: "🔁", isRunEntry: true };
  }

  if (parts[2] === "main") {
    return { type: "main", typeLabel: "Main Session", typeEmoji: "🫙", isRunEntry: false };
  }

  if (parts[2] === "cron") {
    return {
      type: "cron",
      typeLabel: "Cron Job",
      typeEmoji: "🕐",
      cronJobId: parts[3],
      isRunEntry: false,
    };
  }

  if (parts[2] === "subagent") {
    return {
      type: "subagent",
      typeLabel: "Sub-agent",
      typeEmoji: "🤖",
      subagentId: parts[3],
      isRunEntry: false,
    };
  }

  return {
    type: "direct",
    typeLabel: parts[2] ? `${parts[2].charAt(0).toUpperCase() + parts[2].slice(1)} Chat` : "Direct Chat",
    typeEmoji: "💬",
    isRunEntry: false,
  };
}

function createDefaultSession(sessionId: string): Session {
  return {
    id: sessionId,
    key: `unknown:${sessionId}`,
    type: "unknown",
    typeLabel: "Unknown",
    typeEmoji: "❓",
    sessionId,
    updatedAt: Date.now(),
    ageMs: 0,
    model: "unknown",
    modelProvider: "unknown",
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextTokens: 0,
    contextUsedPercent: null,
    aborted: false,
  };
}

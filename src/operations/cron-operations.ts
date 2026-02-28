/**
 * Cron Operations Layer
 * Pure functions for cron job management with validation and error handling
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

// Types
export interface CronJob {
  id: string;
  name: string;
  schedule?: string;
  every?: string;
  at?: string;
  timezone?: string;
  agentId?: string;
  message?: string;
  description?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  lastStatus?: "success" | "error" | "running" | "pending";
}

export interface CreateCronJobInput {
  name: string;
  schedule?: string;
  every?: string;
  at?: string;
  timezone?: string;
  agentId?: string;
  message?: string;
  description?: string;
  disabled?: boolean;
}

export interface UpdateCronJobInput {
  id: string;
  name?: string;
  schedule?: string;
  every?: string;
  at?: string;
  timezone?: string;
  agentId?: string;
  message?: string;
  description?: string;
  enabled?: boolean;
}

export interface RunCronJobInput {
  id: string;
  async?: boolean;
}

export interface DeleteCronJobInput {
  id: string;
}

export interface ListCronJobsInput {
  enabled?: boolean;
  agentId?: string;
}

// Validation
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateJobName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name?.trim()) {
    errors.push("Job name is required");
  } else if (name.length > 100) {
    errors.push("Job name must be less than 100 characters");
  } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    errors.push("Job name can only contain letters, numbers, hyphens, and underscores");
  }

  return { valid: errors.length === 0, errors };
}

export function validateCronExpression(expression: string): ValidationResult {
  const errors: string[] = [];

  if (!expression?.trim()) {
    errors.push("Cron expression is required when schedule is used");
    return { valid: false, errors };
  }

  // Basic cron validation (5 or 6 fields)
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    errors.push("Invalid cron expression (expected 5 or 6 fields)");
    return { valid: false, errors };
  }

  // More detailed validation using cron-parser
  try {
    const { isValidCron } = require("@/lib/cron-parser");
    if (!isValidCron(expression)) {
      errors.push("Invalid cron expression syntax");
    }
  } catch {
    // If cron-parser not available, do basic check
  }

  return { valid: errors.length === 0, errors };
}

export function validateCreateCronJob(input: CreateCronJobInput): ValidationResult {
  const errors: string[] = [];

  const nameResult = validateJobName(input.name);
  errors.push(...nameResult.errors);

  // Must have schedule, every, or at
  if (!input.schedule && !input.every && !input.at) {
    errors.push("At least one of schedule, every, or at is required");
  }

  // Validate cron expression if provided
  if (input.schedule) {
    const cronResult = validateCronExpression(input.schedule);
    errors.push(...cronResult.errors);
  }

  // Validate timezone if provided
  if (input.timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: input.timezone });
    } catch {
      errors.push("Invalid timezone");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateJobId(id: string): ValidationResult {
  const errors: string[] = [];

  if (!id) {
    errors.push("Job ID is required");
  } else if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    errors.push("Invalid job ID format");
  }

  return { valid: errors.length === 0, errors };
}

// Helper
function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

function getGatewayConfig(): { token: string; port: number } {
  try {
    const configRaw = readFileSync(
      (process.env.OPENCLAW_DIR || "/root/.openclaw") + "/openclaw.json",
      "utf-8"
    );
    const config = JSON.parse(configRaw);
    return {
      token: config.gateway?.auth?.token || "",
      port: config.gateway?.port || 18789,
    };
  } catch {
    return { token: "", port: 18789 };
  }
}

// Operations
export async function listCronJobs(
  input: ListCronJobsInput = {}
): Promise<{ success: boolean; data?: CronJob[]; error?: string }> {
  try {
    const output = execSync("openclaw cron list --json --all 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });

    let jobs: CronJob[] = [];
    try {
      const data = JSON.parse(output);
      jobs = (data.jobs || []).map(parseCronJob);
    } catch {
      // Handle non-JSON output
    }

    // Filter by enabled status
    if (input.enabled !== undefined) {
      jobs = jobs.filter((j) => j.enabled === input.enabled);
    }

    // Filter by agent
    if (input.agentId) {
      jobs = jobs.filter((j) => j.agentId === input.agentId);
    }

    return { success: true, data: jobs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list cron jobs",
    };
  }
}

export async function createCronJob(
  input: CreateCronJobInput
): Promise<{ success: boolean; data?: CronJob; error?: string }> {
  // Validate
  const validation = validateCreateCronJob(input);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  try {
    const args: string[] = ["openclaw", "cron", "add", "--json"];

    args.push("--name", escapeShellArg(input.name));

    if (input.schedule) {
      args.push("--cron", escapeShellArg(input.schedule));
    }

    if (input.every) {
      args.push("--every", escapeShellArg(input.every));
    }

    if (input.at) {
      args.push("--at", escapeShellArg(input.at));
    }

    if (input.timezone) {
      args.push("--tz", escapeShellArg(input.timezone));
    }

    if (input.agentId) {
      args.push("--agent", escapeShellArg(input.agentId));
    }

    if (input.message) {
      args.push("--message", escapeShellArg(input.message));
    }

    if (input.description) {
      args.push("--description", escapeShellArg(input.description));
    }

    if (input.disabled) {
      args.push("--disabled");
    }

    const command = args.join(" ");
    const output = execSync(command, {
      timeout: 15000,
      encoding: "utf-8",
    });

    let jobData: CronJob;
    try {
      const parsed = JSON.parse(output);
      jobData = parseCronJob(parsed);
    } catch {
      jobData = {
        id: input.name.toLowerCase().replace(/\s+/g, "-"),
        name: input.name,
        enabled: !input.disabled,
      };
    }

    // Create notification
    await createNotification(
      "Cron Job Created",
      `Job "${input.name}" has been created successfully.`,
      "success"
    );

    return { success: true, data: jobData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create cron job",
    };
  }
}

export async function updateCronJob(
  input: UpdateCronJobInput
): Promise<{ success: boolean; data?: CronJob; error?: string }> {
  const idValidation = validateJobId(input.id);
  if (!idValidation.valid) {
    return { success: false, error: idValidation.errors.join("; ") };
  }

  if (input.schedule) {
    const cronResult = validateCronExpression(input.schedule);
    if (!cronResult.valid) {
      return { success: false, error: cronResult.errors.join("; ") };
    }
  }

  try {
    // Check if only toggling enabled
    if (
      input.enabled !== undefined &&
      !input.name &&
      !input.schedule &&
      !input.every &&
      !input.at &&
      !input.timezone &&
      !input.agentId &&
      !input.message &&
      !input.description
    ) {
      const action = input.enabled ? "enable" : "disable";
      execSync(`openclaw cron ${action} ${input.id} --json 2>/dev/null`, {
        timeout: 10000,
        encoding: "utf-8",
      });

      return { success: true, data: { id: input.id, enabled: input.enabled } as CronJob };
    }

    const args: string[] = ["openclaw", "cron", "edit", input.id];

    if (input.name) {
      args.push("--name", escapeShellArg(input.name));
    }

    if (input.schedule) {
      args.push("--cron", escapeShellArg(input.schedule));
    }

    if (input.every) {
      args.push("--every", escapeShellArg(input.every));
    }

    if (input.at) {
      args.push("--at", escapeShellArg(input.at));
    }

    if (input.timezone) {
      args.push("--tz", escapeShellArg(input.timezone));
    }

    if (input.agentId) {
      args.push("--agent", escapeShellArg(input.agentId));
    }

    if (input.message) {
      args.push("--message", escapeShellArg(input.message));
    }

    if (input.description) {
      args.push("--description", escapeShellArg(input.description));
    }

    if (input.enabled === true) {
      args.push("--enable");
    } else if (input.enabled === false) {
      args.push("--disable");
    }

    const command = args.join(" ");
    const output = execSync(command, {
      timeout: 15000,
      encoding: "utf-8",
    });

    let jobData: CronJob;
    try {
      const parsed = JSON.parse(output);
      jobData = parseCronJob(parsed);
    } catch {
      jobData = {
        id: input.id,
        name: input.name || "",
        enabled: input.enabled ?? true,
      };
    }

    return { success: true, data: jobData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cron job",
    };
  }
}

export async function deleteCronJob(
  input: DeleteCronJobInput
): Promise<{ success: boolean; error?: string }> {
  const validation = validateJobId(input.id);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  try {
    execSync(`openclaw cron rm ${input.id} 2>/dev/null`, {
      timeout: 10000,
      encoding: "utf-8",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete cron job",
    };
  }
}

export async function runCronJob(
  input: RunCronJobInput
): Promise<{ success: boolean; data?: { runId: string }; error?: string }> {
  const validation = validateJobId(input.id);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  try {
    const args = ["openclaw", "cron", "run", input.id];
    if (input.async) {
      args.push("--async");
    }
    args.push("--json");

    const output = execSync(args.join(" "), {
      timeout: 30000,
      encoding: "utf-8",
    });

    let runId = "";
    try {
      const data = JSON.parse(output);
      runId = data.runId || data.id || "";
    } catch {
      // Non-JSON output
    }

    return { success: true, data: { runId } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to run cron job",
    };
  }
}

// Helper functions
function parseCronJob(raw: Record<string, unknown>): CronJob {
  return {
    id: (raw.id || raw.name) as string,
    name: (raw.name || raw.id) as string,
    schedule: raw.schedule as string | undefined,
    every: raw.every as string | undefined,
    at: raw.at as string | undefined,
    timezone: raw.timezone as string | undefined,
    agentId: raw.agentId as string | undefined,
    message: raw.message as string | undefined,
    description: raw.description as string | undefined,
    enabled: raw.enabled !== false && raw.disabled !== true,
    lastRun: raw.lastRun as string | undefined,
    nextRun: raw.nextRun as string | undefined,
    lastStatus: raw.lastStatus as CronJob["lastStatus"],
  };
}

async function createNotification(
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error"
): Promise<void> {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type }),
      }
    );
  } catch {
    // Ignore notification errors
  }
}

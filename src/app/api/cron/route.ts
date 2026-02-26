import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

interface GatewayConfig {
  token: string;
  port: number;
}

function getGatewayConfig(): GatewayConfig {
  try {
    const configRaw = readFileSync((process.env.OPENCLAW_DIR || "/root/.openclaw") + "/openclaw.json", "utf-8");
    const config = JSON.parse(configRaw);
    return {
      token: config.gateway?.auth?.token || "",
      port: config.gateway?.port || 18789,
    };
  } catch {
    return { token: "", port: 18789 };
  }
}

export async function GET() {
  try {
    execSync("openclaw cron list --json --all 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });

    const config = getGatewayConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching cron jobs from gateway:", error);
    return NextResponse.json(
      { error: "Failed to fetch cron jobs from OpenClaw gateway" },
      { status: 500 }
    );
  }
}

function formatDescription(job: Record<string, unknown>): string {
  const payload = job.payload as Record<string, unknown>;
  if (!payload) return "";
  if (payload.kind === "agentTurn") {
    const msg = (payload.message as string) || "";
    return msg.length > 120 ? msg.substring(0, 120) + "..." : msg;
  }
  if (payload.kind === "systemEvent") {
    const text = (payload.text as string) || "";
    return text.length > 120 ? text.substring(0, 120) + "..." : text;
  }
  return "";
}

function formatSchedule(schedule: Record<string, unknown>): string {
  if (!schedule) return "Unknown";
  switch (schedule.kind) {
    case "cron":
      return `${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ""}`;
    case "every":
      const ms = schedule.everyMs as number;
      if (ms >= 3600000) return `Every ${ms / 3600000}h`;
      if (ms >= 60000) return `Every ${ms / 60000}m`;
      return `Every ${ms / 1000}s`;
    case "at":
      return `Once at ${schedule.at}`;
    default:
      return JSON.stringify(schedule);
  }
}

// PUT: Toggle enable/disable a cron job
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const action = enabled ? "enable" : "disable";
    // Use openclaw CLI to update the job
    const output = execSync(
      `openclaw cron ${action} ${id} --json 2>/dev/null || openclaw cron update ${id} --enabled=${enabled} --json 2>/dev/null`,
      { timeout: 10000, encoding: "utf-8" }
    );

    return NextResponse.json({ success: true, id, enabled });
  } catch (error) {
    console.error("Error updating cron job:", error);
    return NextResponse.json(
      { error: "Failed to update cron job" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a cron job
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    execSync(`openclaw cron remove ${id} 2>/dev/null`, {
      timeout: 10000,
      encoding: "utf-8",
    });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Error deleting cron job:", error);
    return NextResponse.json(
      { error: "Failed to delete cron job" },
      { status: 500 }
    );
  }
}

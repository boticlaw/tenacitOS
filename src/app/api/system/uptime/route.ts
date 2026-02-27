import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || "/root", ".openclaw");

interface HeartbeatLog {
  timestamp: string;
  status: "ok" | "error";
}

interface UptimeStats {
  uptimePercentage: number;
  lastHeartbeat: string | null;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  downtimeEvents: number;
  period: {
    start: string;
    end: string;
  };
}

function readHeartbeatLogs(): HeartbeatLog[] {
  const logPath = path.join(OPENCLAW_DIR, "logs/heartbeat.jsonl");

  if (!fs.existsSync(logPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(logPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    return lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((log): log is HeartbeatLog => log !== null);
  } catch {
    return [];
  }
}

function calculateUptime(logs: HeartbeatLog[], daysBack: number = 30): UptimeStats {
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const recentLogs = logs.filter((log) => new Date(log.timestamp) >= startDate);

  const successfulChecks = recentLogs.filter((log) => log.status === "ok").length;
  const failedChecks = recentLogs.filter((log) => log.status === "error").length;
  const totalChecks = recentLogs.length;

  let downtimeEvents = 0;
  let inDowntime = false;
  for (const log of recentLogs) {
    if (log.status === "error" && !inDowntime) {
      downtimeEvents++;
      inDowntime = true;
    } else if (log.status === "ok") {
      inDowntime = false;
    }
  }

  const lastHeartbeat =
    recentLogs.length > 0 ? recentLogs[recentLogs.length - 1].timestamp : null;

  const uptimePercentage =
    totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 100 * 100) / 100 : 100;

  return {
    uptimePercentage,
    lastHeartbeat,
    totalChecks,
    successfulChecks,
    failedChecks,
    downtimeEvents,
    period: {
      start: startDate.toISOString(),
      end: now.toISOString(),
    },
  };
}

export async function GET() {
  try {
    const logs = readHeartbeatLogs();
    const stats = calculateUptime(logs);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to calculate uptime:", error);
    return NextResponse.json({ error: "Failed to calculate uptime" }, { status: 500 });
  }
}

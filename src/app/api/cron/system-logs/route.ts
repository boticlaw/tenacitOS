import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const LOG_DIRS = ["/var/log"];
const MAX_LINES = 100;

function findLogFile(id: string, hintPath?: string): string | null {
  if (hintPath && existsSync(hintPath)) {
    return hintPath;
  }

  const patterns = [
    `/var/log/${id}.log`,
    `/var/log/${id}-sync.log`,
    `/var/log/${id.replace(/-/g, "_")}.log`,
    `/var/log/${id.replace(/-/g, "")}.log`,
  ];

  for (const p of patterns) {
    if (existsSync(p)) return p;
  }

  for (const logDir of LOG_DIRS) {
    if (!existsSync(logDir)) continue;
    try {
      const files = readdirSync(logDir);
      const match = files.find(
        (f) =>
          f.toLowerCase().includes(id.toLowerCase().replace(/-/g, "")) ||
          f.toLowerCase().includes(id.toLowerCase().replace(/-/g, "_"))
      );
      if (match) {
        return join(logDir, match);
      }
    } catch {
      // Ignore errors reading log directory
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const logPath = searchParams.get("path");

    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const logFile = findLogFile(id, logPath || undefined);

    if (!logFile) {
      return NextResponse.json({
        logs: "",
        path: null,
        lines: 0,
        totalLines: 0,
        message: "Log file not found. The job may not have a log file configured.",
      });
    }

    try {
      const content = readFileSync(logFile, "utf-8");
      const allLines = content.split("\n");
      const lines = allLines.slice(-MAX_LINES);

      return NextResponse.json({
        logs: lines.join("\n"),
        path: logFile,
        lines: lines.length,
        totalLines: allLines.length,
      });
    } catch (readError) {
      return NextResponse.json({
        logs: "",
        path: logFile,
        lines: 0,
        totalLines: 0,
        error: `Cannot read log file: ${readError instanceof Error ? readError.message : "Unknown error"}`,
      });
    }
  } catch (error) {
    console.error("[system-logs] Error:", error);
    return NextResponse.json({ error: "Failed to read logs" }, { status: 500 });
  }
}

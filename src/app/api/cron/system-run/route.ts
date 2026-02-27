import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const CRON_DIR = "/etc/cron.d";
const MAX_OUTPUT_SIZE = 10 * 1024;
const TIMEOUT_MS = 30000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const cronPath = join(CRON_DIR, id);
    if (!existsSync(cronPath)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const content = readFileSync(cronPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    const cronLine = lines[0];

    if (!cronLine) {
      return NextResponse.json({ error: "No command found in cron file" }, { status: 400 });
    }

    const parts = cronLine.split(/\s+/);
    if (parts.length < 7) {
      return NextResponse.json({ error: "Invalid cron format" }, { status: 400 });
    }

    const [, , , , , , ...cmdParts] = parts;
    let command = cmdParts.join(" ");

    command = command.replace(/>>.*$/, "").replace(/2>&1/g, "").trim();

    if (!command) {
      return NextResponse.json({ error: "Empty command" }, { status: 400 });
    }

    console.log(`[system-run] Executing: ${command}`);

    const output = execSync(command, {
      timeout: TIMEOUT_MS,
      encoding: "utf-8",
      cwd: "/tmp",
      maxBuffer: MAX_OUTPUT_SIZE * 2,
    });

    const truncated = output.length > MAX_OUTPUT_SIZE;

    return NextResponse.json({
      success: true,
      output: output.slice(0, MAX_OUTPUT_SIZE),
      truncated,
      command,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[system-run] Error:", error);

    if (message.includes("ETIMEDOUT") || message.includes("timed out")) {
      return NextResponse.json(
        {
          success: false,
          error: "Command timed out after 30 seconds",
        },
        { status: 408 }
      );
    }

    const stderr = (error as { stderr?: string })?.stderr || "";
    return NextResponse.json(
      {
        success: false,
        error: message,
        output: stderr.slice(0, MAX_OUTPUT_SIZE),
      },
      { status: 500 }
    );
  }
}

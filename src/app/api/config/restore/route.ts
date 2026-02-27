import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || "/root", ".openclaw");
const CONFIG_PATH = path.join(OPENCLAW_DIR, "openclaw.json");
const BACKUP_PATH = CONFIG_PATH + ".backup";

export async function GET() {
  try {
    if (!fs.existsSync(BACKUP_PATH)) {
      return NextResponse.json({
        hasBackup: false,
        backup: null,
      });
    }

    const stats = fs.statSync(BACKUP_PATH);

    return NextResponse.json({
      hasBackup: true,
      backup: {
        timestamp: stats.mtime.toISOString(),
        size: stats.size,
        file: "openclaw.json.backup",
      },
    });
  } catch (error) {
    console.error("Failed to check backup:", error);
    return NextResponse.json(
      {
        hasBackup: false,
        backup: null,
        error: "Failed to check backup status",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    if (!fs.existsSync(BACKUP_PATH)) {
      return NextResponse.json(
        {
          error: "No backup file found",
          message: "There is no backup to restore from.",
        },
        { status: 404 }
      );
    }

    const backupContent = fs.readFileSync(BACKUP_PATH, "utf-8");
    const backupData = JSON.parse(backupContent);

    const stats = fs.statSync(BACKUP_PATH);
    const backupTimestamp = stats.mtime.toISOString();

    fs.writeFileSync(CONFIG_PATH, backupContent);

    console.log(`[${new Date().toISOString()}] Config restored from backup created at ${backupTimestamp}`);

    return NextResponse.json({
      success: true,
      message: "Configuration restored successfully",
      restoredFrom: {
        timestamp: backupTimestamp,
        file: "openclaw.json.backup",
      },
      config: backupData,
    });
  } catch (error) {
    console.error("Failed to restore config:", error);
    return NextResponse.json(
      {
        error: "Failed to restore configuration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

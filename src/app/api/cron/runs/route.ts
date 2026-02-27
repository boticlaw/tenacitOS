import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

// GET: Fetch run history for a cron job with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    let runs: RunEntry[] = [];

    try {
      const output = execSync(`openclaw cron runs ${id} --json 2>/dev/null`, {
        timeout: 10000,
        encoding: "utf-8",
      });

      const data = JSON.parse(output);
      const rawRuns: RawRun[] = data.runs || data || [];

      runs = rawRuns.map((r: RawRun) => ({
        id: r.id || `${id}-${r.startedAt}`,
        jobId: id,
        startedAt: r.startedAt || r.createdAt || null,
        completedAt: r.completedAt || r.finishedAt || null,
        status: r.status || "unknown",
        durationMs:
          r.durationMs ||
          (r.startedAt && r.completedAt
            ? new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()
            : null),
        error: r.error || null,
      }));
    } catch {
      runs = [];
    }

    let filteredRuns = runs;

    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        filteredRuns = filteredRuns.filter((r) => {
          if (!r.startedAt) return false;
          return new Date(r.startedAt) >= fromDate;
        });
      }
    }

    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        filteredRuns = filteredRuns.filter((r) => {
          if (!r.startedAt) return false;
          return new Date(r.startedAt) <= toDate;
        });
      }
    }

    if (status && ["success", "error", "pending", "running"].includes(status)) {
      filteredRuns = filteredRuns.filter((r) => r.status === status);
    }

    const limitedRuns = filteredRuns.slice(0, limit);

    return NextResponse.json({
      runs: limitedRuns,
      total: filteredRuns.length,
      limit,
      filters: { from, to, status },
    });
  } catch (error) {
    console.error("Error fetching run history:", error);
    return NextResponse.json({ error: "Failed to fetch run history" }, { status: 500 });
  }
}

interface RawRun {
  id?: string;
  startedAt?: string;
  createdAt?: string;
  completedAt?: string;
  finishedAt?: string;
  status?: string;
  durationMs?: number;
  error?: string;
}

interface RunEntry {
  id: string;
  jobId: string;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  durationMs: number | null;
  error: string | null;
}

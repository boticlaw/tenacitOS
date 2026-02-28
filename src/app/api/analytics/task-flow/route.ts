import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const TASK_TYPES = ["research", "code", "review", "deploy", "notify", "analyze"];
const STATUSES = ["success", "error", "pending"];

function getDemoData(): SankeyData {
  const nodes: SankeyNode[] = [
    ...TASK_TYPES.map((t) => ({ name: t.charAt(0).toUpperCase() + t.slice(1) })),
    ...STATUSES.map((s) => ({ name: s.charAt(0).toUpperCase() + s.slice(1) })),
  ];

  const links: SankeyLink[] = [
    { source: 0, target: 6, value: 45 },
    { source: 0, target: 7, value: 5 },
    { source: 1, target: 6, value: 80 },
    { source: 1, target: 7, value: 10 },
    { source: 1, target: 8, value: 10 },
    { source: 2, target: 6, value: 30 },
    { source: 2, target: 7, value: 8 },
    { source: 3, target: 6, value: 25 },
    { source: 3, target: 7, value: 5 },
    { source: 4, target: 6, value: 60 },
    { source: 5, target: 6, value: 35 },
    { source: 5, target: 8, value: 5 },
  ];

  return { nodes, links };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "week";

  try {
    return NextResponse.json(getDemoData());
  } catch (error) {
    console.error("[task-flow] Error:", error);
    return NextResponse.json(getDemoData());
  }
}

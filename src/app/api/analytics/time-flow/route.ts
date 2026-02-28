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

function getDemoData(): SankeyData {
  const nodes: SankeyNode[] = [
    { name: "Morning (6-12)" },
    { name: "Afternoon (12-18)" },
    { name: "Evening (18-24)" },
    { name: "Night (0-6)" },
    { name: "Research" },
    { name: "Coding" },
    { name: "Review" },
    { name: "Deploy" },
    { name: "Completed" },
    { name: "Failed" },
    { name: "Partial" },
  ];

  const links: SankeyLink[] = [
    { source: 0, target: 4, value: 30 },
    { source: 0, target: 5, value: 50 },
    { source: 0, target: 6, value: 20 },
    { source: 1, target: 4, value: 20 },
    { source: 1, target: 5, value: 60 },
    { source: 1, target: 7, value: 30 },
    { source: 2, target: 5, value: 25 },
    { source: 2, target: 6, value: 40 },
    { source: 3, target: 4, value: 15 },
    { source: 4, target: 8, value: 55 },
    { source: 4, target: 10, value: 10 },
    { source: 5, target: 8, value: 110 },
    { source: 5, target: 9, value: 15 },
    { source: 5, target: 10, value: 10 },
    { source: 6, target: 8, value: 50 },
    { source: 6, target: 10, value: 10 },
    { source: 7, target: 8, value: 25 },
    { source: 7, target: 9, value: 5 },
  ];

  return { nodes, links };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "week";

  try {
    return NextResponse.json(getDemoData());
  } catch (error) {
    console.error("[time-flow] Error:", error);
    return NextResponse.json(getDemoData());
  }
}

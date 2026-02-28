import { NextRequest, NextResponse } from "next/server";
import { getDatabase, getCostByModel } from "@/lib/usage-queries";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "week";

  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json(getDemoData());
    }

    const days = period === "month" ? 30 : period === "week" ? 7 : 1;
    const modelData = getCostByModel(db, days);

    if (modelData.length === 0) {
      return NextResponse.json(getDemoData());
    }

    const totalInput = modelData.reduce((sum, m) => sum + m.inputTokens, 0);
    const totalOutput = modelData.reduce((sum, m) => sum + m.outputTokens, 0);
    const cacheHit = Math.floor(totalInput * 0.3);
    const cacheMiss = totalInput - cacheHit;

    const nodes: SankeyNode[] = [
      { name: "Input Tokens" },
      { name: "Cache Hit" },
      { name: "Cache Miss" },
      { name: "Processing" },
      { name: "Output Tokens" },
    ];

    const links: SankeyLink[] = [
      { source: 0, target: 1, value: cacheHit },
      { source: 0, target: 2, value: cacheMiss },
      { source: 1, target: 3, value: cacheHit },
      { source: 2, target: 3, value: cacheMiss },
      { source: 3, target: 4, value: totalOutput },
    ];

    return NextResponse.json({ nodes, links, stats: { totalInput, totalOutput, cacheHit } });
  } catch (error) {
    console.error("[token-flow] Error:", error);
    return NextResponse.json(getDemoData());
  }
}

function getDemoData(): SankeyData {
  return {
    nodes: [
      { name: "Input Tokens" },
      { name: "Cache Hit" },
      { name: "Cache Miss" },
      { name: "Processing" },
      { name: "Output Tokens" },
    ],
    links: [
      { source: 0, target: 1, value: 30000 },
      { source: 0, target: 2, value: 70000 },
      { source: 1, target: 3, value: 30000 },
      { source: 2, target: 3, value: 70000 },
      { source: 3, target: 4, value: 45000 },
    ],
  };
}

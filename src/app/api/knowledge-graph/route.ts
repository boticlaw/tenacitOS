import { NextResponse } from "next/server";
import { parseMemoryFiles } from "@/lib/memory-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const graph = parseMemoryFiles();
    return NextResponse.json(graph);
  } catch (error) {
    console.error("[knowledge-graph] Error:", error);
    return NextResponse.json({ error: "Failed to parse knowledge graph" }, { status: 500 });
  }
}

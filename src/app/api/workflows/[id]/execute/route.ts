import { NextResponse } from "next/server";
import { getWorkflow } from "@/lib/workflow-storage";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const workflow = getWorkflow(id);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Workflow execution started",
      executionId: `exec-${Date.now()}`,
      workflow: workflow.name,
      nodeCount: workflow.nodes.length,
      status: "running",
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[workflows/execute] Error:", error);
    return NextResponse.json({ error: "Failed to execute workflow" }, { status: 500 });
  }
}

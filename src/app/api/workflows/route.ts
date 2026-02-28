import { NextRequest, NextResponse } from "next/server";
import { loadWorkflows, createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow, importWorkflow } from "@/lib/workflow-storage";
import type { Workflow } from "@/lib/workflow-templates";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const workflow = getWorkflow(id);
      if (!workflow) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
      }
      return NextResponse.json({ workflow });
    }

    const workflows = loadWorkflows();
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("[workflows] Error:", error);
    return NextResponse.json({ error: "Failed to load workflows" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.import) {
      const workflow = importWorkflow(body.import);
      if (!workflow) {
        return NextResponse.json({ error: "Invalid workflow JSON" }, { status: 400 });
      }
      return NextResponse.json({ workflow });
    }

    const workflow = createWorkflow(body as Workflow);
    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("[workflows] Error:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    const workflow = updateWorkflow(id, updates);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("[workflows] Error:", error);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
  }

  try {
    const deleted = deleteWorkflow(id);
    if (!deleted) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[workflows] Error:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}

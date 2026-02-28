import { NextRequest, NextResponse } from "next/server";
import { loadExperiments, getExperiment, createExperiment, deleteExperiment } from "@/lib/playground-storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const experiment = getExperiment(id);
      if (!experiment) {
        return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
      }
      return NextResponse.json({ experiment });
    }

    const experiments = loadExperiments();
    return NextResponse.json({ experiments });
  } catch (error) {
    console.error("[playground/experiments] Error:", error);
    return NextResponse.json({ error: "Failed to load experiments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, prompt, models, responses, notes } = body;

    if (!name || !prompt || !models || !responses) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const experiment = createExperiment(name, prompt, models, responses, notes);
    return NextResponse.json({ experiment });
  } catch (error) {
    console.error("[playground/experiments] Error:", error);
    return NextResponse.json({ error: "Failed to create experiment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Experiment ID is required" }, { status: 400 });
  }

  try {
    const deleted = deleteExperiment(id);
    if (!deleted) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[playground/experiments] Error:", error);
    return NextResponse.json({ error: "Failed to delete experiment" }, { status: 500 });
  }
}

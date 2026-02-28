import { NextRequest, NextResponse } from "next/server";
import { applySuggestion, getSuggestionById } from "@/lib/suggestions-engine";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const suggestion = getSuggestionById(id);
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const success = applySuggestion(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to apply suggestion" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Suggestion applied",
      action: suggestion.action 
    });
  } catch (error) {
    console.error("[suggestions/apply] Error:", error);
    return NextResponse.json({ error: "Failed to apply suggestion" }, { status: 500 });
  }
}

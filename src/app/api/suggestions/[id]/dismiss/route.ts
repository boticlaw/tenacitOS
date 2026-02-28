import { NextRequest, NextResponse } from "next/server";
import { dismissSuggestion } from "@/lib/suggestions-engine";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const success = dismissSuggestion(id);
    if (!success) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Suggestion dismissed" });
  } catch (error) {
    console.error("[suggestions/dismiss] Error:", error);
    return NextResponse.json({ error: "Failed to dismiss suggestion" }, { status: 500 });
  }
}

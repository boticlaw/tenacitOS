import { NextRequest, NextResponse } from "next/server";
import { aggregateCommunications, MessageType } from "@/lib/communication-aggregator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const messageTypesParam = searchParams.get("messageTypes");

  let messageTypes: MessageType[] | undefined;
  if (messageTypesParam) {
    messageTypes = messageTypesParam.split(",") as MessageType[];
  }

  try {
    const graph = aggregateCommunications({
      sessionId,
      startDate,
      endDate,
      messageTypes,
    });

    return NextResponse.json(graph);
  } catch (error) {
    console.error("[subagents/communications] Error:", error);
    return NextResponse.json({ error: "Failed to aggregate communications" }, { status: 500 });
  }
}

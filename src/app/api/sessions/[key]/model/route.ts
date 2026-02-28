import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

interface ModelUpdateResponse {
  success: boolean;
  model?: string;
  error?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse<ModelUpdateResponse>> {
  try {
    const { key } = await params;
    const body = await request.json();
    const { model } = body;

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Model is required" },
        { status: 400 }
      );
    }

    const decodedKey = decodeURIComponent(key);

    try {
      execSync(`openclaw session set-model "${decodedKey}" "${model}"`, {
        encoding: "utf-8",
        timeout: 10000,
      });

      return NextResponse.json({ success: true, model });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Model change not supported - command not available",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[session/model] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update model" },
      { status: 500 }
    );
  }
}

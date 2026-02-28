import { NextRequest, NextResponse } from "next/server";
import { getGeneratedReport, shareReport, revokeShare } from "@/lib/report-generator";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json().catch(() => ({}));
    const { expiresInDays } = body;

    const report = getGeneratedReport(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const token = shareReport(id, expiresInDays);
    if (!token) {
      return NextResponse.json({ error: "Failed to share report" }, { status: 500 });
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/reports/${token}`;

    return NextResponse.json({ token, shareUrl, expiresInDays });
  } catch (error) {
    console.error("[reports/share] Error:", error);
    return NextResponse.json({ error: "Failed to share report" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const revoked = revokeShare(id);
    if (!revoked) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reports/share] Error:", error);
    return NextResponse.json({ error: "Failed to revoke share" }, { status: 500 });
  }
}

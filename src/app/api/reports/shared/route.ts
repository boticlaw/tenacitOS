import { NextRequest, NextResponse } from "next/server";
import { getReportByShareToken } from "@/lib/report-generator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const report = getReportByShareToken(token);
    if (!report) {
      return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("[reports/shared] Error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

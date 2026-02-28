import { NextRequest, NextResponse } from "next/server";
import {
  loadGeneratedReports,
  createGeneratedReport,
  deleteGeneratedReport,
  generateReportData,
} from "@/lib/report-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reports = loadGeneratedReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[reports] Error:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, period } = body;

    if (!name || !type || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = generateReportData(period);
    const report = createGeneratedReport(name, type, period, data);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("[reports] Error:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
  }

  try {
    const deleted = deleteGeneratedReport(id);
    if (!deleted) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reports] Error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}

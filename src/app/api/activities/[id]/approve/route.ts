import { NextResponse } from "next/server";
import {
  getActivityById,
  updateActivityStatus,
  logActivity,
} from "@/lib/activities-db";

export const dynamic = "force-dynamic";

interface ApprovalRequest {
  approved: boolean;
  reason?: string;
  approvedBy?: string;
}

interface ApprovalResponse {
  success: boolean;
  status?: string;
  executedAt?: string;
  rejectedAt?: string;
  error?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApprovalResponse>> {
  try {
    const { id } = await params;
    const body: ApprovalRequest = await request.json();
    const { approved, reason, approvedBy = "admin" } = body;

    const activity = getActivityById(id);

    if (!activity) {
      return NextResponse.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    if (activity.type !== "approval") {
      return NextResponse.json(
        { success: false, error: "Activity is not an approval request" },
        { status: 400 }
      );
    }

    if (activity.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Activity already ${activity.status}` },
        { status: 400 }
      );
    }

    const metadata = activity.metadata || {};

    if (approved) {
      const action = metadata.action as string | undefined;
      if (action) {
        try {
          console.log(`[Approval] Executing approved action: ${action}`);
        } catch (execError) {
          console.error("[Approval] Failed to execute action:", execError);
          updateActivityStatus(id, "error", {
            ...metadata,
            approvedBy,
            approvedAt: new Date().toISOString(),
            executionError: String(execError),
          });

          return NextResponse.json(
            { success: false, error: "Action execution failed" },
            { status: 500 }
          );
        }
      }

      updateActivityStatus(id, "approved", {
        ...metadata,
        approvedBy,
        approvedAt: new Date().toISOString(),
      });

      logActivity("security", `Approval granted for: ${activity.description}`, "success", {
        metadata: {
          originalActivityId: id,
          action: metadata.action,
          approvedBy,
        },
      });

      return NextResponse.json({
        success: true,
        status: "approved",
        executedAt: new Date().toISOString(),
      });
    } else {
      updateActivityStatus(id, "rejected", {
        ...metadata,
        rejectedBy: approvedBy,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || "No reason provided",
      });

      logActivity("security", `Approval rejected for: ${activity.description}`, "error", {
        metadata: {
          originalActivityId: id,
          reason: reason || "No reason provided",
          rejectedBy: approvedBy,
        },
      });

      return NextResponse.json({
        success: true,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("[approve] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process approval" },
      { status: 500 }
    );
  }
}

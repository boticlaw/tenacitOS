"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  X,
  Loader2,
  Shield,
  User,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApprovalMetadata {
  action?: string;
  requestedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface ApprovalCardProps {
  id: string;
  description: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  metadata: ApprovalMetadata | null;
  onDecision?: (id: string, approved: boolean) => void;
}

export function ApprovalCard({
  id,
  description,
  timestamp,
  status,
  metadata,
  onDecision,
}: ApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (approved: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/activities/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process");
      }

      setLocalStatus(approved ? "approved" : "rejected");
      onDecision?.(id, approved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (localStatus === "pending") {
    return (
      <div
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          borderRadius: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
            }}
          >
            <AlertTriangle
              style={{ width: "18px", height: "18px", color: "#f59e0b" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontWeight: 600, color: "#f59e0b" }}>
                Approval Required
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.125rem 0.5rem",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  borderRadius: "0.25rem",
                  color: "#f59e0b",
                }}
              >
                Pending
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginTop: "0.25rem",
              }}
            >
              {metadata?.requestedBy && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <User style={{ width: "12px", height: "12px" }} />
                  {metadata.requestedBy}
                </span>
              )}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                <Clock style={{ width: "12px", height: "12px" }} />
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "0.75rem",
            fontSize: "0.875rem",
          }}
        >
          {description}
        </p>

        {metadata?.action && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              backgroundColor: "rgba(42, 42, 42, 0.5)",
              borderRadius: "0.375rem",
              marginBottom: "0.75rem",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Shield
              style={{
                width: "12px",
                height: "12px",
                marginRight: "0.5rem",
                opacity: 0.7,
              }}
            />
            {metadata.action}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: "0.375rem",
              marginBottom: "0.75rem",
              color: "var(--error)",
              fontSize: "0.75rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => handleDecision(true)}
            disabled={loading}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.625rem 1rem",
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "0.5rem",
              color: "#22c55e",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <Loader2
                style={{
                  width: "16px",
                  height: "16px",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <Check style={{ width: "16px", height: "16px" }} />
            )}
            Approve
          </button>

          <button
            type="button"
            onClick={() => handleDecision(false)}
            disabled={loading}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.625rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "0.5rem",
              color: "#ef4444",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
            Reject
          </button>
        </div>
      </div>
    );
  }

  if (localStatus === "approved") {
    return (
      <div
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          borderRadius: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "50%",
              backgroundColor: "rgba(34, 197, 94, 0.15)",
            }}
          >
            <Check style={{ width: "18px", height: "18px", color: "#22c55e" }} />
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "#22c55e" }}>Approved</span>
            <span
              style={{
                color: "var(--text-muted)",
                marginLeft: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              {description}
            </span>
          </div>
          {metadata?.approvedBy && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              by {metadata.approvedBy}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (localStatus === "rejected") {
    return (
      <div
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
            }}
          >
            <X style={{ width: "18px", height: "18px", color: "#ef4444" }} />
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "#ef4444" }}>Rejected</span>
            <span
              style={{
                color: "var(--text-muted)",
                marginLeft: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              {description}
            </span>
          </div>
          {metadata?.rejectionReason && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              Reason: {metadata.rejectionReason}
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

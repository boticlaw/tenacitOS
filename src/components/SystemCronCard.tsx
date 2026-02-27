"use client";

import { useState } from "react";
import {
  Clock,
  Play,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import type { SystemCronJob } from "@/app/api/cron/system/route";

interface SystemCronCardProps {
  job: SystemCronJob;
  onRun: (id: string) => Promise<void>;
  onViewLogs: (id: string, logPath?: string) => void;
}

export function SystemCronCard({ job, onRun, onViewLogs }: SystemCronCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<"success" | "error" | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setRunStatus(null);
    try {
      await onRun(job.id);
      setRunStatus("success");
    } catch {
      setRunStatus("error");
    } finally {
      setIsRunning(false);
      setTimeout(() => setRunStatus(null), 3000);
    }
  };

  const shortCommand =
    job.command.length > 60
      ? job.command.substring(0, 60) + "..."
      : job.command;

  return (
    <div
      style={{
        border: "1px solid",
        borderColor: "color-mix(in srgb, var(--info) 40%, var(--border))",
        borderRadius: "0.75rem",
        backgroundColor: "color-mix(in srgb, var(--info) 5%, var(--card))",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>🖥️</span>
        <h3
          style={{
            fontWeight: 600,
            color: "var(--text-primary)",
            flex: 1,
            fontSize: "1rem",
          }}
        >
          {job.name}
        </h3>
        <span
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "0.25rem",
            backgroundColor: "color-mix(in srgb, var(--info) 20%, transparent)",
            color: "var(--info)",
            fontSize: "0.7rem",
            fontWeight: 600,
          }}
        >
          System
        </span>
      </div>

      {job.description && (
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            marginBottom: "0.5rem",
          }}
        >
          {job.description}
        </p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <Clock className="w-4 h-4" style={{ color: "var(--info)" }} />
        <code
          style={{
            fontSize: "0.75rem",
            backgroundColor: "var(--card-elevated)",
            padding: "0.25rem 0.5rem",
            borderRadius: "0.25rem",
          }}
        >
          {job.schedule}
        </code>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          → {job.scheduleDisplay}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
        <code
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {shortCommand}
        </code>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => onViewLogs(job.id, job.logPath)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            backgroundColor: "var(--card)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          📋 Logs
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleRun}
          disabled={isRunning}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            backgroundColor:
              runStatus === "success"
                ? "color-mix(in srgb, var(--success) 20%, transparent)"
                : runStatus === "error"
                ? "color-mix(in srgb, var(--error) 20%, transparent)"
                : "var(--info)",
            color: runStatus ? "var(--text-primary)" : "#000",
            border: "none",
            cursor: isRunning ? "not-allowed" : "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            opacity: isRunning ? 0.7 : 1,
          }}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Running...</span>
            </>
          ) : runStatus === "success" ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Done!</span>
            </>
          ) : runStatus === "error" ? (
            <>
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Error</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Run Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface SystemCronLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobName: string;
  logPath?: string;
}

export function SystemCronLogsModal({
  isOpen,
  onClose,
  jobId,
  jobName,
  logPath,
}: SystemCronLogsModalProps) {
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ id: jobId });
      if (logPath) params.set("path", logPath);

      const res = await fetch(`/api/cron/system-logs?${params.toString()}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error || data.message || "Failed to load logs");
      } else {
        setLogs(data.logs || "No logs available");
        setPath(data.path);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOpen = () => {
    fetchLogs();
  };

  if (!logs && !loading && !error) {
    handleOpen();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "80vh",
          backgroundColor: "var(--card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            📋 Logs: {jobName}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{ padding: "1rem", overflow: "auto", flex: 1 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Loading logs...
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "color-mix(in srgb, var(--error) 10%, transparent)",
                borderRadius: "0.5rem",
                color: "var(--error)",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {path && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  📁 {path}
                </p>
              )}
              <pre
                style={{
                  backgroundColor: "var(--card-elevated)",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  overflow: "auto",
                  maxHeight: "400px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {logs || "No logs available"}
              </pre>
            </>
          )}
        </div>

        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={fetchLogs}
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--accent)",
              color: "#000",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

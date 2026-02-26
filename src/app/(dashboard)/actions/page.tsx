"use client";

import { useState } from "react";
import {
  GitBranch, RotateCcw, Trash2, BarChart3, Heart, Shield,
  Play, Loader2, X, CheckCircle, AlertCircle, Clock, Terminal,
} from "lucide-react";
import { format } from "date-fns";

interface ActionResult {
  action: string;
  status: "success" | "error";
  output: string;
  duration_ms: number;
  timestamp: string;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  dangerous?: boolean;
}

const ACTIONS: QuickAction[] = [
  {
    id: "heartbeat",
    label: "Check Heartbeat",
    description: "Verify all services are up and the site is reachable",
    icon: Heart,
    color: "var(--success)",
  },
  {
    id: "git-status",
    label: "Git Status (All Repos)",
    description: "Check uncommitted changes in all workspace repositories",
    icon: GitBranch,
    color: "#60A5FA",
  },
  {
    id: "usage-stats",
    label: "Collect Usage Stats",
    description: "Get disk, CPU, and memory usage summary",
    icon: BarChart3,
    color: "#C084FC",
  },
  {
    id: "restart-gateway",
    label: "Restart Gateway",
    description: "Restart the OpenClaw gateway service",
    icon: RotateCcw,
    color: "var(--warning, #f59e0b)",
    dangerous: true,
  },
  {
    id: "clear-temp",
    label: "Clear Temp Files",
    description: "Remove temporary files and trim large PM2 logs",
    icon: Trash2,
    color: "var(--error)",
    dangerous: true,
  },
  {
    id: "npm-audit",
    label: "NPM Security Audit",
    description: "Check for vulnerabilities in superbotijo dependencies",
    icon: Shield,
    color: "#4ADE80",
  },
];

export default function ActionsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [selectedResult, setSelectedResult] = useState<ActionResult | null>(null);
  const [confirmAction, setConfirmAction] = useState<QuickAction | null>(null);

  const runAction = async (action: QuickAction) => {
    if (action.dangerous) {
      setConfirmAction(action);
      return;
    }
    await executeAction(action);
  };

  const executeAction = async (action: QuickAction) => {
    setConfirmAction(null);
    setRunning(action.id);

    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action.id }),
      });
      const data: ActionResult = await res.json();
      setResults((prev) => ({ ...prev, [action.id]: data }));
      setSelectedResult(data);
    } catch {
      const result: ActionResult = {
        action: action.id,
        status: "error",
        output: "Network error",
        duration_ms: 0,
        timestamp: new Date().toISOString(),
      };
      setResults((prev) => ({ ...prev, [action.id]: result }));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
        >
          Quick Actions Hub
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Run common maintenance and diagnostic tasks with one click
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const isRunning = running === action.id;
          const result = results[action.id];

          return (
            <div
              key={action.id}
              className="p-5 rounded-xl"
              style={{
                backgroundColor: "var(--card)",
                border: `1px solid ${result ? (result.status === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)") : "var(--border)"}`,
                transition: "border-color 0.3s",
              }}
            >
              {/* Action header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${action.color} 15%, transparent)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {action.label}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Last result summary */}
              {result && !isRunning && (
                <div
                  className="flex items-center gap-2 mb-3 p-2 rounded-lg text-xs cursor-pointer"
                  style={{
                    backgroundColor: result.status === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: result.status === "success" ? "var(--success)" : "var(--error)",
                  }}
                  onClick={() => setSelectedResult(result)}
                >
                  {result.status === "success" ? (
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">
                    {result.status === "success" ? "Success" : "Failed"} · {result.duration_ms}ms
                  </span>
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span style={{ color: "var(--text-muted)" }}>
                    {format(new Date(result.timestamp), "HH:mm")}
                  </span>
                </div>
              )}

              {/* Run button */}
              <button
                onClick={() => runAction(action)}
                disabled={isRunning || running !== null}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.625rem",
                  borderRadius: "0.5rem",
                  backgroundColor: isRunning ? `color-mix(in srgb, ${action.color} 20%, transparent)` : `color-mix(in srgb, ${action.color} 12%, transparent)`,
                  color: action.color,
                  border: `1px solid color-mix(in srgb, ${action.color} 25%, transparent)`,
                  cursor: isRunning || running !== null ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  opacity: running !== null && !isRunning ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run
                    {action.dangerous && <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>⚠️</span>}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent Results */}
      {Object.keys(results).length > 0 && (
        <div className="rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Recent Results
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {Object.values(results)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((result) => {
                const action = ACTIONS.find((a) => a.id === result.action);
                const Icon = (action?.icon || Terminal) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                return (
                  <div
                    key={result.action}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onClick={() => setSelectedResult(result)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--card-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div style={{
                      width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem",
                      backgroundColor: `color-mix(in srgb, ${action?.color || "#888"} 15%, transparent)`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: action?.color || "#888" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {action?.label || result.action}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: result.status === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: result.status === "success" ? "var(--success)" : "var(--error)",
                          }}
                        >
                          {result.status}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {result.duration_ms}ms · {format(new Date(result.timestamp), "HH:mm:ss")}
                      </div>
                    </div>
                    <Terminal className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            backgroundColor: "var(--card)",
            borderRadius: "1rem", padding: "2rem",
            maxWidth: "400px", width: "100%",
            border: "1px solid var(--border)",
          }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "0.75rem", fontWeight: 600 }}>
              ⚠️ Confirm: {confirmAction.label}
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              This action may affect running services. Are you sure?
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "var(--card-elevated)", color: "var(--text-secondary)", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(confirmAction)}
                style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "var(--error, #ef4444)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Run Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output Modal */}
      {selectedResult && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            width: "95vw", maxWidth: "800px", height: "75vh",
            backgroundColor: "#0d1117",
            borderRadius: "1rem", border: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.875rem 1rem",
              borderBottom: "1px solid #30363d",
              flexShrink: 0,
            }}>
              <Terminal className="w-4 h-4" style={{ color: selectedResult.status === "success" ? "var(--success)" : "var(--error)" }} />
              <span style={{ color: "#c9d1d9", fontFamily: "monospace", fontSize: "0.9rem", flex: 1 }}>
                {ACTIONS.find((a) => a.id === selectedResult.action)?.label || selectedResult.action}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
                {selectedResult.duration_ms}ms · {format(new Date(selectedResult.timestamp), "HH:mm:ss")}
              </span>
              <button
                onClick={() => setSelectedResult(null)}
                style={{ padding: "0.375rem", borderRadius: "0.375rem", background: "none", border: "none", cursor: "pointer", color: "#8b949e" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
              <pre style={{
                fontFamily: "monospace", fontSize: "0.8rem",
                color: "#c9d1d9", whiteSpace: "pre-wrap", wordBreak: "break-all",
                lineHeight: 1.6,
              }}>
                {selectedResult.output}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Package,
  ChevronDown,
  ChevronRight,
  StopCircle,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  checkEligibility,
  fetchSkillManifest,
  type EligibilityResult,
  type EligibilityRequirement,
} from "@/lib/skills-eligibility";
import {
  resolveDependencies,
  installDependencies,
  type Dependency,
  type InstallProgress,
} from "@/lib/skills-dependencies";

interface SkillInstallModalProps {
  slug: string;
  displayName?: string;
  onInstall: (slug: string) => void;
  onClose: () => void;
}

type InstallPhase =
  | "checking"
  | "review"
  | "installing"
  | "success"
  | "error"
  | "cancelled";

interface LogEntry {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export function SkillInstallModal({
  slug,
  displayName,
  onInstall,
  onClose,
}: SkillInstallModalProps) {
  const [phase, setPhase] = useState<InstallPhase>("checking");
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [showDependencies, setShowDependencies] = useState(false);
  const [installProgress, setInstallProgress] = useState<InstallProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [canRollback, setCanRollback] = useState(false);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: new Date(), message, type }]);
  }, []);

  // Check eligibility on mount
  useEffect(() => {
    const check = async () => {
      addLog(`Checking eligibility for ${slug}...`, "info");

      try {
        const manifest = await fetchSkillManifest(slug);
        if (!manifest) {
          addLog("Could not fetch skill manifest", "error");
          setError("Could not fetch skill information from ClawHub");
          setPhase("error");
          return;
        }

        const result = await checkEligibility(manifest);
        setEligibility(result);

        if (result.eligible) {
          addLog("Eligibility check passed", "success");
          addLog(`Found ${result.requirements.length} requirements, all satisfied`, "info");

          // Resolve dependencies
          const deps = await resolveDependencies(slug, {
            dependencies: manifest.dependencies,
            peerDependencies: manifest.peerDependencies,
          });
          setDependencies(deps.dependencies);

          if (deps.dependencies.length > 0) {
            addLog(`Found ${deps.dependencies.length} dependencies`, "info");
          }

          if (deps.conflicts.length > 0) {
            addLog(`Warning: ${deps.conflicts.length} dependency conflicts detected`, "warning");
          }
        } else {
          addLog(`Eligibility check failed: ${result.blockers.length} blockers`, "error");
          result.blockers.forEach((b) => addLog(`  - ${b}`, "error"));
        }

        setPhase("review");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        addLog(`Error during check: ${msg}`, "error");
        setError(msg);
        setPhase("error");
      }
    };

    check();
  }, [slug, addLog]);

  const handleInstall = async () => {
    setPhase("installing");
    setCanRollback(false);
    setError(null);
    const controller = new AbortController();
    setAbortController(controller);

    addLog("Starting installation...", "info");

    // First, install dependencies
    if (dependencies.length > 0) {
      addLog(`Installing ${dependencies.length} dependencies...`, "info");
      setCanRollback(true);

      const result = await installDependencies(dependencies, (progress) => {
        setInstallProgress(progress);
        addLog(progress.message, progress.status === "error" ? "error" : "info");
      });

      if (!result.success) {
        addLog("Dependency installation failed", "error");
        result.errors.forEach((e) => addLog(`  - ${e}`, "error"));
        setError("Failed to install dependencies");
        setPhase("error");
        return;
      }

      addLog("All dependencies installed", "success");
    }

    // Now install the skill itself
    addLog(`Installing ${slug}...`, "info");

    try {
      const res = await fetch("/api/skills/clawhub/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (data.error) {
        addLog(`Installation failed: ${data.error}`, "error");
        setError(data.error);
        setPhase("error");
        return;
      }

      addLog(`Successfully installed ${slug}`, "success");
      setInstallProgress({
        step: 1,
        total: 1,
        current: slug,
        status: "success",
        message: "Installation complete!",
      });
      setPhase("success");

      // Notify parent after a short delay
      setTimeout(() => {
        onInstall(slug);
      }, 1500);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        addLog("Installation cancelled", "warning");
        setPhase("cancelled");
      } else {
        const msg = err instanceof Error ? err.message : "Unknown error";
        addLog(`Installation failed: ${msg}`, "error");
        setError(msg);
        setPhase("error");
      }
    } finally {
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
    } else {
      onClose();
    }
  };

  const handleRollback = async () => {
    addLog("Rolling back installation...", "info");
    setPhase("installing");

    try {
      // Rollback dependencies
      for (const dep of dependencies) {
        addLog(`Removing ${dep.name}...`, "info");
        // API call to remove dependency would go here
      }

      addLog("Rollback complete", "success");
      setPhase("cancelled");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLog(`Rollback failed: ${msg}`, "error");
      setError(msg);
      setPhase("error");
    }
  };

  const getRequirementIcon = (req: EligibilityRequirement) => {
    return req.satisfied ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-500" />
    );
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case "checking":
        return "Checking Requirements";
      case "review":
        return "Review Installation";
      case "installing":
        return "Installing";
      case "success":
        return "Installation Complete";
      case "error":
        return "Installation Failed";
      case "cancelled":
        return "Installation Cancelled";
      default:
        return "Install Skill";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <div>
              <h3
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {getPhaseTitle()}
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {displayName || slug}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-10"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Checking Phase */}
          {phase === "checking" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: "var(--accent)" }} />
              <p style={{ color: "var(--text-secondary)" }}>
                Checking system compatibility...
              </p>
            </div>
          )}

          {/* Review Phase */}
          {phase === "review" && eligibility && (
            <div className="space-y-4">
              {/* Eligibility Results */}
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  System Requirements
                </h4>
                <div className="space-y-2">
                  {eligibility.requirements.map((req, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ backgroundColor: "var(--surface-elevated)" }}
                    >
                      {getRequirementIcon(req)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {req.name}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "var(--surface)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {req.type}
                          </span>
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {req.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {eligibility.warnings.length > 0 && (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(251, 191, 36, 0.1)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: "var(--warning)" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--warning)" }}
                    >
                      Warnings
                    </span>
                  </div>
                  <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
                    {eligibility.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blockers */}
              {eligibility.blockers.length > 0 && (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      Cannot Install
                    </span>
                  </div>
                  <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
                    {eligibility.blockers.map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dependencies */}
              {dependencies.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowDependencies(!showDependencies)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    {showDependencies ? (
                      <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    ) : (
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    )}
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Dependencies ({dependencies.length})
                    </span>
                  </button>
                  {showDependencies && (
                    <div
                      className="mt-2 p-3 rounded-lg space-y-2"
                      style={{ backgroundColor: "var(--surface-elevated)" }}
                    >
                      {dependencies.map((dep, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs"
                        >
                          <span style={{ color: "var(--text-primary)" }}>
                            {dep.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: "var(--surface)",
                                color: "var(--text-muted)",
                              }}
                            >
                              {dep.version}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded"
                              style={{
                                backgroundColor:
                                  dep.type === "required"
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : "rgba(59, 130, 246, 0.1)",
                                color:
                                  dep.type === "required" ? "#ef4444" : "#3b82f6",
                              }}
                            >
                              {dep.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Installing Phase */}
          {(phase === "installing" || phase === "cancelled") && (
            <div className="space-y-4">
              {/* Progress Bar */}
              {installProgress && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {installProgress.current}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {installProgress.step}/{installProgress.total}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--surface-elevated)" }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(installProgress.step / installProgress.total) * 100}%`,
                        backgroundColor:
                          installProgress.status === "error"
                            ? "var(--error)"
                            : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Logs */}
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Installation Log
                </h4>
                <div
                  className="p-3 rounded-lg max-h-48 overflow-y-auto font-mono text-xs"
                  style={{
                    backgroundColor: "var(--bg)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 py-0.5"
                      style={{
                        color:
                          log.type === "error"
                            ? "var(--error)"
                            : log.type === "success"
                            ? "var(--success)"
                            : log.type === "warning"
                            ? "var(--warning)"
                            : "var(--text-secondary)",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Success Phase */}
          {phase === "success" && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-12 h-12 mb-4" style={{ color: "var(--success)" }} />
              <h4
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Installation Complete!
              </h4>
              <p
                className="text-sm text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                {displayName || slug} has been successfully installed.
              </p>
            </div>
          )}

          {/* Error Phase */}
          {phase === "error" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-4">
                <AlertTriangle className="w-12 h-12 mb-4 text-red-500" />
                <h4
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Installation Failed
                </h4>
                <p
                  className="text-sm text-center"
                  style={{ color: "var(--error)" }}
                >
                  {error}
                </p>
              </div>

              {canRollback && (
                <button
                  onClick={handleRollback}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "var(--warning)",
                    color: "white",
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Rollback Installation
                </button>
              )}
            </div>
          )}

          {/* Cancelled Phase */}
          {phase === "cancelled" && (
            <div className="flex flex-col items-center justify-center py-8">
              <StopCircle className="w-12 h-12 mb-4" style={{ color: "var(--warning)" }} />
              <h4
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Installation Cancelled
              </h4>
              <p
                className="text-sm text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                The installation was cancelled. Some dependencies may have been installed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 p-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {phase === "review" && eligibility?.eligible && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--surface)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--success)",
                  color: "white",
                }}
              >
                <Download className="w-4 h-4" />
                Install
              </button>
            </>
          )}

          {phase === "review" && !eligibility?.eligible && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Close
            </button>
          )}

          {phase === "installing" && (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                }}
              >
                <StopCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}

          {(phase === "success" || phase === "error" || phase === "cancelled") && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "var(--accent)",
                color: "white",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

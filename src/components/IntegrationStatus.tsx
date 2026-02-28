"use client";

import { useState } from "react";
import { MessageCircle, Twitter, Mail, CheckCircle, XCircle, AlertCircle, RefreshCw, Play, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Integration {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "configured" | "not_configured";
  icon: string;
  lastActivity: string | null;
  detail?: string | null;
}

interface IntegrationStatusProps {
  integrations: Integration[] | null;
}

interface ActivityStats {
  lastActivity: string | null;
  lastActivityRelative: string | null;
  usage24h: number;
  usage7d: number;
  usage30d: number;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Twitter,
  Mail,
};

const statusConfig = {
  connected: {
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    label: "Connected",
  },
  disconnected: {
    icon: XCircle,
    color: "text-error",
    bg: "bg-error/10",
    border: "border-error/30",
    label: "Disconnected",
  },
  configured: {
    icon: CheckCircle,
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    label: "Configured",
  },
  not_configured: {
    icon: AlertCircle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    label: "Not Configured",
  },
};

export function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [activityStats, setActivityStats] = useState<Record<string, ActivityStats>>({});
  const [loadingStats, setLoadingStats] = useState<string | null>(null);

  const handleTest = async (integrationId: string) => {
    setTestingId(integrationId);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/test`, {
        method: "POST",
      });
      const result = await res.json();
      setTestResults((prev) => ({ ...prev, [integrationId]: result }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [integrationId]: { success: false, message: "Test failed" },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleReauth = async (integrationId: string) => {
    if (!confirm(`Reauthenticate ${integrationId}? This may require manual action.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/integrations/${integrationId}/reauth`, {
        method: "POST",
      });
      const result = await res.json();
      
      if (result.instructions) {
        alert(result.instructions);
      }
    } catch (error) {
      console.error("Reauth failed:", error);
    }
  };

  const loadActivityStats = async (integrationId: string) => {
    setLoadingStats(integrationId);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/last-activity`);
      const stats = await res.json();
      setActivityStats((prev) => ({ ...prev, [integrationId]: stats }));
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoadingStats(null);
    }
  };

  if (!integrations) {
    return (
      <div className="bg-neutral-900 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-neutral-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-neutral-800 rounded"></div>
          <div className="h-16 bg-neutral-800 rounded"></div>
          <div className="h-16 bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-success" />
        Integrations
      </h2>

      <div className="space-y-3">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.icon] || MessageCircle;
          const status = statusConfig[integration.status];
          const StatusIcon = status.icon;
          const testResult = testResults[integration.id];
          const stats = activityStats[integration.id];
          const isTesting = testingId === integration.id;
          const isLoadingStats = loadingStats === integration.id;

          return (
            <div
              key={integration.id}
              className={`p-4 rounded-lg border ${status.bg} ${status.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-800 rounded-lg">
                    <Icon className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{integration.name}</div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      {stats?.lastActivityRelative ? (
                        <span>Last: {stats.lastActivityRelative}</span>
                      ) : integration.lastActivity ? (
                        <span>
                          Last:{" "}
                          {formatDistanceToNow(new Date(integration.lastActivity), {
                            addSuffix: true,
                          })}
                        </span>
                      ) : null}
                      {integration.detail && (
                        <span className="text-neutral-500">• {integration.detail}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status badge */}
                  <div className={`flex items-center gap-1.5 ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{status.label}</span>
                  </div>

                  {/* Test button */}
                  <button
                    onClick={() => handleTest(integration.id)}
                    disabled={isTesting}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50"
                    title="Test connection"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-4 h-4 text-neutral-400 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>

                  {/* Reauth button */}
                  {integration.status !== "not_configured" && (
                    <button
                      onClick={() => handleReauth(integration.id)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                      title="Reauthenticate"
                    >
                      <RotateCcw className="w-4 h-4 text-neutral-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div
                  className={`mt-3 p-2 rounded text-xs ${
                    testResult.success
                      ? "bg-success/20 text-emerald-300"
                      : "bg-error/20 text-error"
                  }`}
                >
                  <div className="font-medium">{testResult.message}</div>
                  {testResult.details && (
                    <div className="mt-0.5 opacity-75">{testResult.details}</div>
                  )}
                </div>
              )}

              {/* Usage stats */}
              {stats && (
                <div className="mt-3 pt-3 border-t border-neutral-700/50">
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <button
                      onClick={() => loadActivityStats(integration.id)}
                      disabled={isLoadingStats}
                      className="hover:text-neutral-300 transition-colors"
                    >
                      {isLoadingStats ? (
                        <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                      ) : null}
                      Usage:
                    </button>
                    <span>
                      <strong className="text-neutral-300">{stats.usage24h}</strong> today
                    </span>
                    <span>
                      <strong className="text-neutral-300">{stats.usage7d}</strong> this week
                    </span>
                    <span>
                      <strong className="text-neutral-300">{stats.usage30d}</strong> this month
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load stats for all */}
      <button
        onClick={() => {
          integrations.forEach((i) => loadActivityStats(i.id));
        }}
        className="mt-4 w-full py-2 text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
      >
        Load usage statistics for all integrations
      </button>
    </div>
  );
}

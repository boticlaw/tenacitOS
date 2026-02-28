"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Activity,
  FileText,
  Settings,
  BarChart3,
  Info,
  Pause,
  Play,
  RotateCcw,
  Download,
  MoreVertical,
  ChevronRight,
  Clock,
  Cpu,
  Zap,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Types
interface AgentInfo {
  id: string;
  name: string;
  status: "active" | "paused" | "error" | "idle";
  model: string;
  uptime: number;
  totalRequests: number;
  successRate: number;
  lastActivity: string;
  memoryUsage: number;
  cpuUsage: number;
  config: Record<string, unknown>;
  recentActivities: Activity[];
  logs: LogEntry[];
  metrics: AgentMetrics;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: "success" | "error" | "pending";
  duration?: number;
}

interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AgentMetrics {
  requestsPerHour: number;
  avgResponseTime: number;
  tokenUsage: {
    total: number;
    input: number;
    output: number;
  };
  errorRate: number;
  peakMemory: number;
  totalSessions: number;
}

type TabType = "overview" | "activity" | "logs" | "config" | "metrics";

interface AgentInspectPanelProps {
  agentId: string;
  onClose: () => void;
  onAction?: (action: string, agentId: string) => void;
}

// Storage key for layout persistence
const LAYOUT_STORAGE_KEY = "agent-inspect-layout";

export function AgentInspectPanel({
  agentId,
  onClose,
  onAction,
}: AgentInspectPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [agentData, setAgentData] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelWidth, setPanelWidth] = useState(() => {
    // Load from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${LAYOUT_STORAGE_KEY}-width`);
      return saved ? parseInt(saved, 10) : 600;
    }
    return 600;
  });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Fetch agent data
  useEffect(() => {
    const fetchAgentData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/agents/${agentId}/inspect`);
        if (res.ok) {
          const data = await res.json();
          setAgentData(data);
        }
      } catch (error) {
        console.error("Failed to fetch agent data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchAgentData, 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  // Persist layout
  useEffect(() => {
    localStorage.setItem(`${LAYOUT_STORAGE_KEY}-width`, String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    localStorage.setItem(`${LAYOUT_STORAGE_KEY}-fullscreen`, String(isFullscreen));
  }, [isFullscreen]);

  // Resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.max(400, Math.min(1200, newWidth)));
    };

    const handleMouseUp = () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDown = () => {
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const resizer = resizeRef.current;
    if (resizer) {
      resizer.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      if (resizer) {
        resizer.removeEventListener("mousedown", handleMouseDown);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, onClose]);

  // Action handlers
  const handleAction = useCallback(
    (action: string) => {
      onAction?.(action, agentId);
      setShowContextMenu(false);
    },
    [agentId, onAction]
  );

  const handleExport = useCallback(async () => {
    if (!agentData) return;

    const exportData = {
      agent: agentData,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-${agentId}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowContextMenu(false);
  }, [agentData, agentId]);

  // Tab definitions
  const tabs: Array<{ id: TabType; label: string; icon: typeof Info }> = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "config", label: "Config", icon: Settings },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
  ];

  const getStatusColor = (status: AgentInfo["status"]) => {
    switch (status) {
      case "active":
        return "var(--success)";
      case "paused":
        return "var(--warning)";
      case "error":
        return "var(--error)";
      case "idle":
        return "var(--text-muted)";
    }
  };

  const getStatusIcon = (status: AgentInfo["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      case "error":
        return <AlertTriangle className="w-4 h-4" />;
      case "idle":
        return <Zap className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!agentData && !loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
        <div
          className="p-8 rounded-xl text-center"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <p style={{ color: "var(--text-secondary)" }}>Agent not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 flex flex-col ${
        isFullscreen ? "inset-0" : "top-0 right-0 bottom-0"
      }`}
      style={{
        width: isFullscreen ? "100%" : panelWidth,
        backgroundColor: "var(--surface)",
        borderLeft: isFullscreen ? "none" : "1px solid var(--border)",
      }}
    >
      {/* Resize handle */}
      {!isFullscreen && (
        <div
          ref={resizeRef}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/20 transition-colors"
          style={{ backgroundColor: "transparent" }}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          {agentData && (
            <div
              className="flex items-center gap-2 px-2 py-1 rounded-lg"
              style={{ backgroundColor: "var(--surface-elevated)" }}
            >
              <span style={{ color: getStatusColor(agentData.status) }}>
                {getStatusIcon(agentData.status)}
              </span>
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {agentData.name}
              </span>
            </div>
          )}
          <span
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {agentId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Context menu */}
          <div className="relative">
            <button
              onClick={() => setShowContextMenu(!showContextMenu)}
              className="p-2 rounded-lg hover:bg-opacity-10"
              style={{ color: "var(--text-muted)" }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showContextMenu && (
              <div
                className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg min-w-[180px]"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  zIndex: 60,
                }}
              >
                {agentData?.status === "active" ? (
                  <button
                    onClick={() => handleAction("pause")}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-opacity-10"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <Pause className="w-4 h-4" />
                    Pause Agent
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction("resume")}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-opacity-10"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <Play className="w-4 h-4" />
                    Resume Agent
                  </button>
                )}
                <button
                  onClick={() => handleAction("restart")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-opacity-10"
                  style={{ color: "var(--text-primary)" }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart Agent
                </button>
                <div style={{ borderTop: "1px solid var(--border)" }} className="my-1" />
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-opacity-10"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-opacity-10"
            style={{ color: "var(--text-muted)" }}
            title={isFullscreen ? "Exit fullscreen (Ctrl+F)" : "Fullscreen (Ctrl+F)"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-10"
            style={{ color: "var(--text-muted)" }}
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-4 py-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  activeTab === tab.id ? "var(--accent-soft)" : "transparent",
                color:
                  activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Activity
              className="w-6 h-6 animate-spin"
              style={{ color: "var(--accent)" }}
            />
          </div>
        ) : agentData ? (
          <>
            {activeTab === "overview" && (
              <OverviewTab agent={agentData} />
            )}
            {activeTab === "activity" && (
              <ActivityTab activities={agentData.recentActivities} />
            )}
            {activeTab === "logs" && (
              <LogsTab logs={agentData.logs} />
            )}
            {activeTab === "config" && (
              <ConfigTab config={agentData.config} />
            )}
            {activeTab === "metrics" && (
              <MetricsTab metrics={agentData.metrics} />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ agent }: { agent: AgentInfo }) {
  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Uptime"
          value={formatUptime(agent.uptime)}
        />
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="Total Requests"
          value={agent.totalRequests.toLocaleString()}
        />
        <MetricCard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Success Rate"
          value={`${agent.successRate.toFixed(1)}%`}
        />
        <MetricCard
          icon={<Cpu className="w-4 h-4" />}
          label="CPU Usage"
          value={`${agent.cpuUsage.toFixed(1)}%`}
        />
      </div>

      {/* Model info */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: "var(--surface-elevated)" }}
      >
        <h3
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Model
        </h3>
        <p style={{ color: "var(--text-secondary)" }}>{agent.model}</p>
      </div>

      {/* Memory usage */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: "var(--surface-elevated)" }}
      >
        <h3
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Memory Usage
        </h3>
        <div className="flex items-center gap-4">
          <div
            className="flex-1 h-2 rounded-full"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (agent.memoryUsage / 1024) * 100)}%`,
                backgroundColor:
                  agent.memoryUsage > 800 ? "var(--error)" : "var(--accent)",
              }}
            />
          </div>
          <span
            className="text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {formatBytes(agent.memoryUsage * 1024 * 1024)}
          </span>
        </div>
      </div>

      {/* Last activity */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: "var(--surface-elevated)" }}
      >
        <h3
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Last Activity
        </h3>
        <p style={{ color: "var(--text-secondary)" }}>
          {agent.lastActivity
            ? new Date(agent.lastActivity).toLocaleString()
            : "No recent activity"}
        </p>
      </div>
    </div>
  );
}

function ActivityTab({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-2">
      {activities.length === 0 ? (
        <div
          className="text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          No recent activity
        </div>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ backgroundColor: "var(--surface-elevated)" }}
          >
            <div
              className="mt-1"
              style={{
                color:
                  activity.status === "success"
                    ? "var(--success)"
                    : activity.status === "error"
                    ? "var(--error)"
                    : "var(--warning)",
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activity.type}
                </span>
                {activity.duration && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--surface)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {activity.duration}ms
                  </span>
                )}
              </div>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {activity.description}
              </p>
              <span
                className="text-xs mt-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function LogsTab({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.level === filter;
  });

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "var(--error)";
      case "warn":
        return "var(--warning)";
      case "debug":
        return "var(--text-muted)";
      default:
        return "var(--accent)";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {["all", "info", "warn", "error", "debug"].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className="px-3 py-1 rounded-lg text-xs font-medium uppercase"
            style={{
              backgroundColor:
                filter === level ? "var(--accent-soft)" : "var(--surface-elevated)",
              color: filter === level ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Logs */}
      <div
        className="rounded-lg p-4 font-mono text-xs space-y-2 max-h-[500px] overflow-auto"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>No logs to display</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className="uppercase font-bold"
                style={{ color: getLevelColor(log.level), flexShrink: 0, width: 50 }}
              >
                {log.level}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ConfigTab({ config }: { config: Record<string, unknown> }) {
  return (
    <div
      className="rounded-lg p-4 font-mono text-xs"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <pre style={{ color: "var(--text-secondary)" }}>
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}

function MetricsTab({ metrics }: { metrics: AgentMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="Requests/Hour"
          value={metrics.requestsPerHour.toLocaleString()}
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Avg Response"
          value={`${metrics.avgResponseTime}ms`}
        />
        <MetricCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" />}
          label="Total Sessions"
          value={metrics.totalSessions.toLocaleString()}
        />
      </div>

      {/* Token usage */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: "var(--surface-elevated)" }}
      >
        <h3
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Token Usage
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--text-secondary)" }}>Input</span>
            <span style={{ color: "var(--text-primary)" }}>
              {metrics.tokenUsage.input.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--text-secondary)" }}>Output</span>
            <span style={{ color: "var(--text-primary)" }}>
              {metrics.tokenUsage.output.toLocaleString()}
            </span>
          </div>
          <div
            className="flex justify-between items-center pt-2"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Total
            </span>
            <span
              className="font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {metrics.tokenUsage.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Peak memory */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: "var(--surface-elevated)" }}
      >
        <h3
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Peak Memory
        </h3>
        <p style={{ color: "var(--text-secondary)" }}>
          {formatBytes(metrics.peakMemory * 1024 * 1024)}
        </p>
      </div>
    </div>
  );
}

// Helper component
function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: "var(--surface-elevated)" }}
    >
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        {icon}
        <span className="text-xs uppercase font-medium">{label}</span>
      </div>
      <div
        className="text-xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}

// Helper functions (duplicated to avoid prop drilling)
function formatUptime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

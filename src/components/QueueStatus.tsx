"use client";

import { useEffect, useState } from "react";
import { ListTodo, Play, Clock, Loader2, Zap, AlertCircle } from "lucide-react";

interface QueuedTask {
  id: string;
  type: string;
  description: string;
  status: "pending" | "running";
  timestamp: string;
  agent: string | null;
  waitTimeMs: number;
  priority: number;
}

interface QueueMetrics {
  totalPending: number;
  totalRunning: number;
  avgWaitTimeMs: number;
  byType: Record<string, number>;
}

interface QueueData {
  pending: QueuedTask[];
  running: QueuedTask[];
  metrics: QueueMetrics | null;
  timestamp: string;
}

function formatWaitTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "security":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "command":
    case "build":
      return <Zap className="w-3.5 h-3.5" />;
    case "task":
    case "tool_call":
    case "agent_action":
      return <ListTodo className="w-3.5 h-3.5" />;
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case "security":
      return "var(--error)";
    case "command":
    case "build":
      return "var(--warning)";
    case "task":
    case "tool_call":
    case "agent_action":
      return "var(--accent)";
    default:
      return "var(--text-muted)";
  }
}

export function QueueStatus() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch("/api/queue");
        if (!res.ok) throw new Error("Failed to fetch queue");
        const queueData = await res.json();
        setData(queueData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading queue");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--text-secondary)" }}>Cargando cola de tareas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--error)" }}>
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const { pending, running, metrics } = data || { pending: [], running: [], metrics: null };
  const hasTasks = pending.length > 0 || running.length > 0;

  return (
    <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--card-elevated)" }}>
            <ListTodo className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Task Queue</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {metrics ? `${metrics.totalPending} pendientes · ${metrics.totalRunning} en ejecución` : "Sin tareas"}
            </p>
          </div>
        </div>
        {metrics && metrics.avgWaitTimeMs > 0 && (
          <div className="text-right">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tiempo promedio</span>
            <p className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>
              {formatWaitTime(metrics.avgWaitTimeMs)}
            </p>
          </div>
        )}
      </div>

      {!hasTasks ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="p-3 rounded-full" style={{ backgroundColor: "var(--success-bg)" }}>
            <ListTodo className="w-6 h-6" style={{ color: "var(--success)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Sin tareas pendientes
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Todo está al día
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {running.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--success)" }}>
                <Play className="w-3 h-3" />
                <span>En ejecución ({running.length})</span>
              </div>
              <div className="space-y-1.5">
                {running.slice(0, 5).map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <Clock className="w-3 h-3" />
                <span>Pendientes ({pending.length})</span>
              </div>
              <div className="space-y-1.5">
                {pending.slice(0, 5).map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
              {pending.length > 5 && (
                <p className="text-xs text-center pt-1" style={{ color: "var(--text-muted)" }}>
                  +{pending.length - 5} más
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {metrics && Object.keys(metrics.byType).length > 0 && hasTasks && (
        <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          {Object.entries(metrics.byType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([type, count]) => (
              <span
                key={type}
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: "var(--card-elevated)",
                  color: getTypeColor(type),
                }}
              >
                {type}: {count}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: QueuedTask }) {
  const isRunning = task.status === "running";

  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg"
      style={{ backgroundColor: "var(--card-elevated)" }}
    >
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: isRunning ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)",
        }}
      >
        {isRunning ? (
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--success)" }} />
        ) : (
          <Clock className="w-3 h-3" style={{ color: "var(--warning)" }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: getTypeColor(task.type) }}
          >
            {getTypeIcon(task.type)}
            <span className="font-medium">{task.type}</span>
          </span>
          {task.agent && (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{ backgroundColor: "var(--card)", color: "var(--text-muted)" }}
            >
              {task.agent}
            </span>
          )}
        </div>
        <p
          className="text-sm truncate mt-0.5"
          style={{ color: "var(--text-primary)" }}
          title={task.description}
        >
          {task.description || "Sin descripción"}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {formatWaitTime(task.waitTimeMs)}
        </span>
      </div>
    </div>
  );
}

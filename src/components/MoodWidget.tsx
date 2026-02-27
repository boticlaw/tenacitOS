"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Activity, AlertTriangle, Zap, ChevronDown, ChevronUp } from "lucide-react";

interface MoodData {
  mood: string;
  emoji: string;
  score: number;
  streak: number;
  metrics: {
    activityCount: number;
    successRate: number;
    avgTokensPerHour: number;
    errorCount: number;
    criticalErrorCount: number;
  };
  description: string;
}

const moodColors: Record<string, string> = {
  productive: "#10b981",
  busy: "#3b82f6",
  idle: "#6b7280",
  frustrated: "#ef4444",
  neutral: "#8b5cf6",
};

export function MoodWidget() {
  const [mood, setMood] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchMood();
    const interval = setInterval(fetchMood, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMood = async () => {
    try {
      const res = await fetch("/api/agents/mood");
      if (res.ok) {
        const data = await res.json();
        setMood(data);
      }
    } catch (error) {
      console.error("Failed to fetch mood:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="p-4 rounded-xl animate-pulse"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full" style={{ backgroundColor: "var(--card-elevated)" }} />
          <div className="flex-1">
            <div className="h-4 w-20 rounded mb-2" style={{ backgroundColor: "var(--card-elevated)" }} />
            <div className="h-3 w-32 rounded" style={{ backgroundColor: "var(--card-elevated)" }} />
          </div>
        </div>
        <div className="h-2 w-full rounded" style={{ backgroundColor: "var(--card-elevated)" }} />
      </div>
    );
  }

  if (!mood) return null;

  const color = moodColors[mood.mood] || "#6b7280";

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl animate-bounce-slow"
            style={{ backgroundColor: `${color}20` }}
          >
            {mood.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>
              {mood.mood}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
              {mood.description}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "var(--text-muted)" }}>Score</span>
            <span style={{ color }}>{mood.score}/100</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--card-elevated)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${mood.score}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {mood.streak > 0 && (
          <div
            className="flex items-center gap-2 text-xs mb-3 px-2 py-1 rounded-md"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
          >
            <Zap className="w-3 h-3" style={{ color: "#f59e0b" }} />
            <span style={{ color: "var(--text-secondary)" }}>
              <strong>{mood.streak}</strong> days without critical errors
            </span>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs w-full justify-center py-2 rounded-md transition-colors hover:opacity-80"
          style={{ backgroundColor: "var(--card-elevated)", color: "var(--text-muted)" }}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show details
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <MetricItem icon={Activity} label="Activities (24h)" value={mood.metrics.activityCount.toString()} />
            <MetricItem
              icon={TrendingUp}
              label="Success Rate"
              value={`${mood.metrics.successRate}%`}
              highlight={mood.metrics.successRate < 80}
            />
            <MetricItem icon={Zap} label="Tokens/hr" value={formatNumber(mood.metrics.avgTokensPerHour)} />
            <MetricItem
              icon={AlertTriangle}
              label="Errors (24h)"
              value={mood.metrics.errorCount.toString()}
              highlight={mood.metrics.errorCount > 5}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: highlight ? "#ef4444" : "var(--text-muted)" }} />
      <div className="min-w-0">
        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: highlight ? "#ef4444" : "var(--text-primary)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

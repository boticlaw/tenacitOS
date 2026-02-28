"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { TokenFlowSankey, TaskFlowSankey, TimeFlowSankey } from "@/components/sankey/SankeyDiagrams";

type FlowType = "token" | "task" | "time";
type Period = "day" | "week" | "month";

interface SankeyData {
  nodes: Array<{ name: string }>;
  links: Array<{ source: number; target: number; value: number }>;
}

export default function FlowsPage() {
  const [activeTab, setActiveTab] = useState<FlowType>("token");
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<SankeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/${activeTab}-flow?period=${period}`);
      if (!res.ok) throw new Error("Failed to load data");
      const flowData = await res.json();
      setData(flowData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: Array<{ id: FlowType; label: string; icon: string }> = [
    { id: "token", label: "Token Flow", icon: "📊" },
    { id: "task", label: "Task Flow", icon: "✅" },
    { id: "time", label: "Time Flow", icon: "⏰" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-1px",
              color: "var(--text-primary)",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <GitBranch style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
            Flow Diagrams
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
            Visualización de flujos con diagramas Sankey
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              fontSize: "12px",
            }}
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={fetchData}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              cursor: isLoading ? "wait" : "pointer",
              fontSize: "12px",
            }}
          >
            <RefreshCw size={14} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          backgroundColor: "var(--card)",
          padding: "4px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          width: "fit-content",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: activeTab === tab.id ? "var(--accent)" : "transparent",
              border: "none",
              borderRadius: "6px",
              color: activeTab === tab.id ? "var(--bg)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 150ms ease",
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
          minHeight: "400px",
        }}
      >
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--text-muted)" }}>
            <div style={{ textAlign: "center" }}>
              <Loader2 size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
              <p>Loading flow data...</p>
            </div>
          </div>
        ) : error ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--error)" }}>
            <div style={{ textAlign: "center" }}>
              <AlertCircle size={32} style={{ marginBottom: "12px" }} />
              <p>{error}</p>
            </div>
          </div>
        ) : data ? (
          <>
            {activeTab === "token" && <TokenFlowSankey data={data} />}
            {activeTab === "task" && <TaskFlowSankey data={data} />}
            {activeTab === "time" && <TimeFlowSankey data={data} />}
          </>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

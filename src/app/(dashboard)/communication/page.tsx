"use client";

import { useCallback, useEffect, useState } from "react";
import { Network, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { CommunicationGraphComponent } from "@/components/CommunicationGraph";
import type { CommunicationGraph, MessageType } from "@/lib/communication-aggregator";

export default function CommunicationPage() {
  const [data, setData] = useState<CommunicationGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ messageTypes: MessageType[] }>({ messageTypes: [] });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.messageTypes.length > 0) {
        params.set("messageTypes", filters.messageTypes.join(","));
      }

      const res = await fetch(`/api/subagents/communications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch communications");
      const graph = await res.json();
      setData(graph);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdgeClick = useCallback((edge: CommunicationGraph["edges"][0]) => {
    console.log("Edge clicked:", edge);
  }, []);

  const handleFilterChange = useCallback((newFilters: { messageTypes: MessageType[] }) => {
    setFilters(newFilters);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "24px 24px 16px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              <Network style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              Agent Communication
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
              Visualización del flujo de comunicación entre agentes
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              cursor: isLoading ? "wait" : "pointer",
              fontSize: "13px",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, borderTop: "1px solid var(--border)" }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Loader2 size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
              <p>Loading communication graph...</p>
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--error)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <AlertCircle size={32} style={{ marginBottom: "12px" }} />
              <p>{error}</p>
              <button
                onClick={fetchData}
                style={{
                  marginTop: "12px",
                  padding: "8px 16px",
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : data && data.nodes.length > 0 ? (
          <CommunicationGraphComponent
            data={data}
            onEdgeClick={handleEdgeClick}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Network size={64} style={{ opacity: 0.3, marginBottom: "16px" }} />
              <p style={{ fontSize: "14px" }}>No communication data found</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Run some sessions with subagents to see the communication graph
              </p>
            </div>
          </div>
        )}
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

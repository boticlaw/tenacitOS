"use client";

import { useEffect, useState } from "react";
import { Network, RefreshCw, AlertCircle } from "lucide-react";
import { KnowledgeGraphComponent } from "@/components/KnowledgeGraph";
import type { KnowledgeGraph } from "@/lib/memory-parser";

export default function KnowledgePage() {
  const [data, setData] = useState<KnowledgeGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/knowledge-graph");
      if (!res.ok) throw new Error("Failed to fetch knowledge graph");
      const graph = await res.json();
      setData(graph);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
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
              Knowledge Graph
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
              Visualización interactiva de entidades y relaciones del agente
            </p>
          </div>
          <button
            onClick={fetchGraph}
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
              <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
              <p>Cargando grafo de conocimiento...</p>
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
                onClick={fetchGraph}
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
        ) : data && data.entities.length > 0 ? (
          <KnowledgeGraphComponent data={data} />
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
              <p style={{ fontSize: "14px" }}>No se encontraron entidades en la memoria</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Añade contenido a MEMORY.md para ver el grafo
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

"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Play, Square, Trash2, Download, Circle, Server } from "lucide-react";

interface LogLine {
  line: string;
  ts: string;
  id: number;
}

const SERVICES = [
  { name: "mission-control", backend: "systemd", label: "SuperBotijo" },
  { name: "classvault", backend: "pm2", label: "ClassVault" },
  { name: "content-vault", backend: "pm2", label: "Content Vault" },
  { name: "brain", backend: "pm2", label: "Brain" },
  { name: "postiz-simple", backend: "pm2", label: "Postiz" },
  { name: "openclaw-gateway", backend: "systemd", label: "Gateway" },
];

function getLineColor(line: string): string {
  const lower = line.toLowerCase();
  if (lower.includes("error") || lower.includes("err]") || lower.includes("exception")) return "#f87171";
  if (lower.includes("warn") || lower.includes("warning")) return "#fbbf24";
  if (lower.includes("info") || lower.includes("[info]")) return "#60a5fa";
  if (lower.includes("success") || lower.includes("✓") || lower.includes("ready")) return "#4ade80";
  if (lower.startsWith("[stream]")) return "#a78bfa";
  return "#c9d1d9";
}

export default function LogsPage() {
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const idRef = useRef(0);

  const startStream = () => {
    if (esRef.current) {
      esRef.current.close();
    }

    setLines([]);
    setStreaming(true);

    const es = new EventSource(
      `/api/logs/stream?service=${encodeURIComponent(selectedService.name)}&backend=${encodeURIComponent(selectedService.backend)}`
    );

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setLines((prev) => {
          const newLine = { line: data.line, ts: data.ts, id: ++idRef.current };
          const updated = [...prev, newLine];
          // Keep max 2000 lines
          return updated.length > 2000 ? updated.slice(-2000) : updated;
        });
      } catch {}
    };

    es.onerror = () => {
      setStreaming(false);
      es.close();
    };

    esRef.current = es;
  };

  const stopStream = () => {
    esRef.current?.close();
    esRef.current = null;
    setStreaming(false);
  };

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  const handleClear = () => setLines([]);

  const handleDownload = () => {
    const text = lines.map((l) => `[${l.ts}] ${l.line}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedService.name}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLines = filter
    ? lines.filter((l) => l.line.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          Log Viewer
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Real-time log streaming from services
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--card)",
      }}>
        {/* Service selector */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {SERVICES.map((svc) => (
            <button
              key={svc.name}
              onClick={() => { setSelectedService(svc); stopStream(); setLines([]); }}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                backgroundColor: selectedService.name === svc.name ? "rgba(255,59,48,0.15)" : "var(--card-elevated)",
                color: selectedService.name === svc.name ? "var(--accent)" : "var(--text-secondary)",
                borderColor: selectedService.name === svc.name ? "rgba(255,59,48,0.4)" : "var(--border)",
              }}
            >
              {svc.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Filter */}
          <input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "0.375rem 0.75rem",
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              outline: "none",
              width: "12rem",
            }}
          />

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title="Auto-scroll"
            style={{
              padding: "0.375rem 0.625rem", borderRadius: "0.5rem", fontSize: "0.75rem",
              backgroundColor: autoScroll ? "rgba(74,222,128,0.1)" : "var(--card-elevated)",
              color: autoScroll ? "#4ade80" : "var(--text-muted)",
              border: "1px solid", borderColor: autoScroll ? "rgba(74,222,128,0.3)" : "var(--border)",
              cursor: "pointer",
            }}
          >
            ↓ Auto
          </button>

          {/* Clear */}
          <button onClick={handleClear} title="Clear"
            style={{ padding: "0.375rem 0.625rem", borderRadius: "0.5rem", background: "var(--card-elevated)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)" }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Download */}
          <button onClick={handleDownload} title="Download logs"
            style={{ padding: "0.375rem 0.625rem", borderRadius: "0.5rem", background: "var(--card-elevated)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)" }}>
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Start/Stop stream */}
          <button
            onClick={streaming ? stopStream : startStream}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: streaming ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)",
              color: streaming ? "#f87171" : "#4ade80",
              border: "1px solid",
              borderColor: streaming ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.3)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {streaming ? (
              <>
                <Square className="w-3.5 h-3.5" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Stream
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.375rem 1.5rem",
        backgroundColor: "#0d1117",
        borderBottom: "1px solid #30363d",
        fontSize: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Circle
            className="w-2 h-2"
            style={{ fill: streaming ? "#4ade80" : "#6b7280", color: streaming ? "#4ade80" : "#6b7280" }}
          />
          <span style={{ color: streaming ? "#4ade80" : "#6b7280" }}>
            {streaming ? "LIVE" : "STOPPED"}
          </span>
        </div>
        <span style={{ color: "#8b949e" }}>
          {selectedService.label} · {selectedService.backend}
        </span>
        <span style={{ color: "#8b949e", marginLeft: "auto" }}>
          {filteredLines.length} lines{filter && ` (filtered from ${lines.length})`}
        </span>
      </div>

      {/* Log output */}
      <div
        ref={logRef}
        onScroll={() => {
          if (logRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logRef.current;
            setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
          }
        }}
        style={{
          flex: 1,
          overflow: "auto",
          backgroundColor: "#0d1117",
          padding: "1rem 1.5rem",
          fontFamily: "monospace",
          fontSize: "0.8rem",
          lineHeight: 1.6,
        }}
      >
        {filteredLines.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#8b949e" }}>
            <Terminal className="w-12 h-12 mb-3 opacity-30" />
            <p>{streaming ? "Waiting for logs..." : "Click 'Stream' to start live log viewer"}</p>
          </div>
        ) : (
          filteredLines.map((l) => (
            <div key={l.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ color: "#484f58", flexShrink: 0, fontSize: "0.7rem", paddingTop: "0.1rem" }}>
                {new Date(l.ts).toLocaleTimeString()}
              </span>
              <span style={{ color: getLineColor(l.line), wordBreak: "break-all" }}>
                {l.line}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Cloud, RefreshCw, Loader2, AlertCircle, Search } from "lucide-react";
import { MemoryWordCloud } from "@/components/MemoryWordCloud";
import type { WordFrequency } from "@/app/api/memories/word-cloud/route";

export default function MemoriesPage() {
  const [words, setWords] = useState<WordFrequency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/memories/word-cloud?source=${source}`);
      if (!res.ok) throw new Error("Failed to load word cloud");
      const data = await res.json();
      setWords(data.words || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [source]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWordClick = useCallback((word: string) => {
    window.open(`/memory?q=${encodeURIComponent(word)}`, "_blank");
  }, []);

  const filteredWords = searchQuery
    ? words.filter((w) => w.word.toLowerCase().includes(searchQuery.toLowerCase()))
    : words;

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
              <Cloud style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              Memory Word Cloud
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
              Visualización de palabras frecuentes en las memorias del agente
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            >
              <option value="all">All memories</option>
              <option value="memory">MEMORY.md only</option>
              <option value="daily">Daily memories</option>
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
      </div>

      <div style={{ padding: "0 24px 16px", display: "flex", gap: "8px", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 12px",
            flex: 1,
            maxWidth: "300px",
          }}
        >
          <Search size={16} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Filter words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              width: "100%",
            }}
          />
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {filteredWords.length} words
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
              <p>Processing memories...</p>
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
            </div>
          </div>
        ) : (
          <div style={{ padding: "24px", height: "100%" }}>
            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <MemoryWordCloud words={filteredWords} onWordClick={handleWordClick} />
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

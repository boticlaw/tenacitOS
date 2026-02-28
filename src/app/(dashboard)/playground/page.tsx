"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Save, Trash2, Clock, History, Copy, Check, Loader2 } from "lucide-react";
import { ModelSelector, ModelOption } from "@/components/ModelSelector";
import { ModelResponseCard } from "@/components/ModelResponseCard";
import type { ModelResponse } from "@/lib/playground-storage";

interface Experiment {
  id: string;
  name: string;
  prompt: string;
  models: string[];
  responses: ModelResponse[];
  createdAt: string;
  notes?: string;
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/playground/compare")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models || []);
        if (data.models?.length >= 2) {
          setSelectedModels(data.models.slice(0, 2).map((m: ModelOption) => m.id));
        }
      })
      .catch(console.error);

    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const res = await fetch("/api/playground/experiments");
      const data = await res.json();
      setExperiments(data.experiments || []);
    } catch (error) {
      console.error("Failed to fetch experiments:", error);
    }
  };

  const runComparison = useCallback(async () => {
    if (!prompt.trim() || selectedModels.length < 2) return;

    setIsLoading(true);
    setResponses([]);

    try {
      const res = await fetch("/api/playground/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, models: selectedModels }),
      });

      const data = await res.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error("Comparison failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, selectedModels]);

  const saveExperiment = async () => {
    if (!saveName.trim() || responses.length === 0) return;

    try {
      await fetch("/api/playground/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName,
          prompt,
          models: selectedModels,
          responses,
        }),
      });

      setShowSaveDialog(false);
      setSaveName("");
      fetchExperiments();
    } catch (error) {
      console.error("Failed to save experiment:", error);
    }
  };

  const deleteExperiment = async (id: string) => {
    try {
      await fetch(`/api/playground/experiments?id=${id}`, { method: "DELETE" });
      fetchExperiments();
    } catch (error) {
      console.error("Failed to delete experiment:", error);
    }
  };

  const loadExperiment = (experiment: Experiment) => {
    setPrompt(experiment.prompt);
    setSelectedModels(experiment.models);
    setResponses(experiment.responses);
    setShowHistory(false);
  };

  const copyShareLink = async (id: string) => {
    const url = `${window.location.origin}/playground?experiment=${id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWinnerMetric = useCallback(() => {
    if (responses.length < 2) return { winner: null, metric: null };
    
    const validResponses = responses.filter((r) => !r.error);
    if (validResponses.length === 0) return { winner: null, metric: null };

    const fastest = validResponses.reduce((a, b) => (a.responseTime < b.responseTime ? a : b));
    const cheapest = validResponses.reduce((a, b) => (a.cost < b.cost ? a : b));

    return { fastest, cheapest };
  }, [responses]);

  const { fastest, cheapest } = getWinnerMetric();

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
              }}
            >
              Model Playground
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
              Compara respuestas de múltiples modelos lado a lado
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: showHistory ? "var(--accent-soft)" : "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: showHistory ? "var(--accent)" : "var(--text-primary)",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <History size={16} />
            History ({experiments.length})
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", borderTop: "1px solid var(--border)" }}>
        <div
          style={{
            width: "360px",
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--surface, var(--card))",
          }}
        >
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Escribe tu prompt aquí..."
                style={{
                  width: "100%",
                  height: "150px",
                  padding: "12px",
                  backgroundColor: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  resize: "none",
                  fontFamily: "var(--font-body)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "4px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                <span>{prompt.length} characters</span>
                <span>~{Math.ceil(prompt.length / 4)} tokens</span>
              </div>
            </div>

            <ModelSelector
              models={models}
              selected={selectedModels}
              onChange={setSelectedModels}
              minSelected={2}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={runComparison}
                disabled={isLoading || !prompt.trim() || selectedModels.length < 2}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  backgroundColor: isLoading ? "var(--accent-soft)" : "var(--accent)",
                  border: "none",
                  borderRadius: "8px",
                  color: "var(--bg)",
                  cursor: isLoading ? "wait" : "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  opacity: isLoading || !prompt.trim() || selectedModels.length < 2 ? 0.6 : 1,
                }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {isLoading ? "Running..." : "Run Comparison"}
              </button>
              {responses.length > 0 && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "12px 16px",
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <Save size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {showHistory ? (
            <div style={{ padding: "16px", overflow: "auto" }}>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Saved Experiments
              </h3>
              {experiments.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                  No saved experiments yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {experiments.map((exp) => (
                    <div
                      key={exp.id}
                      style={{
                        padding: "16px",
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                            {exp.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {new Date(exp.createdAt).toLocaleString()} · {exp.models.length} models
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => copyShareLink(exp.id)}
                            style={{
                              padding: "6px",
                              backgroundColor: "transparent",
                              border: "1px solid var(--border)",
                              borderRadius: "4px",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                            }}
                            title="Copy share link"
                          >
                            {copiedId === exp.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => loadExperiment(exp)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "var(--accent)",
                              border: "none",
                              borderRadius: "4px",
                              color: "var(--bg)",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteExperiment(exp.id)}
                            style={{
                              padding: "6px",
                              backgroundColor: "transparent",
                              border: "1px solid var(--border)",
                              borderRadius: "4px",
                              color: "var(--error)",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {exp.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Loader2 size={32} className="animate-spin" style={{ marginBottom: "12px" }} />
                <p>Running comparison across {selectedModels.length} models...</p>
              </div>
            </div>
          ) : responses.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: responses.length > 2 ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
                padding: "16px",
                overflow: "auto",
                flex: 1,
              }}
            >
              {responses.map((response) => (
                <ModelResponseCard
                  key={response.modelId}
                  response={response}
                  isWinner={response.modelId === fastest?.modelId || response.modelId === cheapest?.modelId}
                  winnerMetric={
                    response.modelId === fastest?.modelId
                      ? "speed"
                      : response.modelId === cheapest?.modelId
                      ? "cost"
                      : null
                  }
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Clock size={64} style={{ opacity: 0.3, marginBottom: "16px" }} />
                <p style={{ fontSize: "14px" }}>Select models and enter a prompt to start</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSaveDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "24px",
              width: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Save Experiment
            </h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Experiment name..."
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveExperiment}
                disabled={!saveName.trim()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--accent)",
                  border: "none",
                  borderRadius: "6px",
                  color: "var(--bg)",
                  cursor: "pointer",
                  opacity: saveName.trim() ? 1 : 0.5,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

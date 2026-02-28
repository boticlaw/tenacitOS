"use client";

import { Check } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

interface ModelSelectorProps {
  models: ModelOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minSelected?: number;
}

export function ModelSelector({ models, selected, onChange, minSelected = 2 }: ModelSelectorProps) {
  const toggleModel = (modelId: string) => {
    if (selected.includes(modelId)) {
      if (selected.length > minSelected) {
        onChange(selected.filter((id) => id !== modelId));
      }
    } else {
      onChange([...selected, modelId]);
    }
  };

  const selectAll = () => {
    onChange(models.filter((m) => m.available).map((m) => m.id));
  };

  const clearAll = () => {
    onChange(models.slice(0, minSelected).map((m) => m.id));
  };

  const providers = [...new Set(models.map((m) => m.provider))];

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
          Select Models ({selected.length} selected, min {minSelected})
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={selectAll}
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            All
          </button>
          <button
            onClick={clearAll}
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {providers.map((provider) => (
        <div key={provider} style={{ marginBottom: "8px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              marginBottom: "6px",
            }}
          >
            {provider}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {models
              .filter((m) => m.provider === provider)
              .map((model) => {
                const isSelected = selected.includes(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    disabled={!model.available}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      backgroundColor: isSelected ? "var(--accent-soft)" : "transparent",
                      border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "6px",
                      color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                      cursor: model.available ? "pointer" : "not-allowed",
                      fontSize: "12px",
                      opacity: model.available ? 1 : 0.5,
                      transition: "all 150ms ease",
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    {model.name}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

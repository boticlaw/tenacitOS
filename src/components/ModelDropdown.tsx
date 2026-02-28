"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Loader2, Cpu } from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

interface ModelDropdownProps {
  currentModel: string;
  sessionKey: string;
  onModelChanged?: (newModel: string) => void;
  disabled?: boolean;
}

function shortModelName(id: string): string {
  const m = id.replace("anthropic/", "").replace("claude-", "");
  const parts = m.split("-");
  if (parts.length >= 2) {
    const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    return `${name} ${parts.slice(1).join(".")}`;
  }
  return id.split("/").pop() || id;
}

export function ModelDropdown({
  currentModel,
  sessionKey,
  onModelChanged,
  disabled = false,
}: ModelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        setModels(data);
      } catch {
        setError("Failed to load models");
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectModel = async (modelId: string) => {
    if (modelId === currentModel || changing) return;

    setChanging(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/sessions/${encodeURIComponent(sessionKey)}/model`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: modelId }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change model");
      }

      onModelChanged?.(modelId);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || changing}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "0.375rem",
          backgroundColor: isOpen ? "var(--surface-elevated)" : "transparent",
          border: "1px solid var(--border)",
          cursor: disabled || changing ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
        }}
      >
        {changing ? (
          <Loader2
            style={{
              width: "12px",
              height: "12px",
              animation: "spin 1s linear infinite",
            }}
          />
        ) : (
          <Cpu style={{ width: "12px", height: "12px" }} />
        )}
        <span>{shortModelName(currentModel)}</span>
        <ChevronDown style={{ width: "10px", height: "10px" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "0.25rem",
            minWidth: "160px",
            backgroundColor: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 50,
            padding: "0.25rem",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "0.5rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <Loader2
                style={{
                  width: "14px",
                  height: "14px",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : error ? (
            <div
              style={{
                padding: "0.5rem",
                color: "var(--error)",
                fontSize: "0.75rem",
              }}
            >
              {error}
            </div>
          ) : (
            models.map((model) => (
              <button
                type="button"
                key={model.id}
                onClick={() => handleSelectModel(model.id)}
                disabled={!model.available || changing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                  backgroundColor:
                    model.id === currentModel
                      ? "rgba(255, 59, 48, 0.1)"
                      : "transparent",
                  border: "none",
                  cursor: !model.available || changing ? "not-allowed" : "pointer",
                  opacity: model.available ? 1 : 0.5,
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  textAlign: "left",
                }}
              >
                <span>{model.name}</span>
                {model.id === currentModel && (
                  <Check
                    style={{ width: "14px", height: "14px", color: "var(--accent)" }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

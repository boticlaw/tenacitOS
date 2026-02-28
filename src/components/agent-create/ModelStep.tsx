"use client";

import { AgentDraft, AVAILABLE_MODELS } from "@/lib/agent-templates";
import { Bot, Thermometer, Hash } from "lucide-react";

interface ModelStepProps {
  draft: AgentDraft;
  onUpdate: (updates: Partial<AgentDraft>) => void;
}

export function ModelStep({ draft, onUpdate }: ModelStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Configure the model
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Set the name and model for your agent.
        </p>
      </div>

      {/* Agent Name */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          <Bot className="inline-block w-4 h-4 mr-2" />
          Agent Name *
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={draft.emoji}
            onChange={(e) => onUpdate({ emoji: e.target.value })}
            className="w-16 h-12 text-center text-2xl rounded-lg"
            style={{
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            maxLength={2}
          />
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="My Assistant"
            className="flex-1 h-12 px-4 rounded-lg"
            style={{
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            maxLength={50}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {draft.name.length}/50 characters
        </p>
      </div>

      {/* Model Selection */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Model *
        </label>
        <select
          value={draft.model}
          onChange={(e) => onUpdate({ model: e.target.value })}
          className="w-full h-12 px-4 rounded-lg appearance-none"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          {AVAILABLE_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
      </div>

      {/* System Prompt */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          System Prompt
        </label>
        <textarea
          value={draft.systemPrompt || ""}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg resize-none"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Temperature */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          <Thermometer className="inline-block w-4 h-4 mr-2" />
          Temperature: {draft.temperature?.toFixed(1) || "0.7"}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={draft.temperature || 0.7}
          onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
          className="w-full"
          style={{ accentColor: "var(--accent)" }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          <span>Precise (0)</span>
          <span>Balanced (1)</span>
          <span>Creative (2)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          <Hash className="inline-block w-4 h-4 mr-2" />
          Max Output Tokens (optional)
        </label>
        <input
          type="number"
          value={draft.maxTokens || ""}
          onChange={(e) =>
            onUpdate({ maxTokens: e.target.value ? parseInt(e.target.value) : undefined })
          }
          placeholder="4096"
          className="w-full h-12 px-4 rounded-lg"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
}

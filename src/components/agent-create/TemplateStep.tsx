"use client";

import { AgentTemplateId, AGENT_TEMPLATES } from "@/lib/agent-templates";
import { Check } from "lucide-react";

interface TemplateStepProps {
  selectedTemplateId: AgentTemplateId | null;
  onSelect: (templateId: AgentTemplateId) => void;
}

export function TemplateStep({ selectedTemplateId, onSelect }: TemplateStepProps) {
  return (
    <div>
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Choose a starting point
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Select a template to pre-configure your agent, or start from scratch.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="relative p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
            style={{
              backgroundColor:
                selectedTemplateId === template.id
                  ? `${template.config.features?.webSearch ? "var(--accent)" : "var(--success)"}15`
                  : "var(--card-elevated)",
              border: `2px solid ${
                selectedTemplateId === template.id
                  ? template.config.features?.webSearch
                    ? "var(--accent)"
                    : "var(--success)"
                  : "var(--border)"
              }`,
            }}
          >
            {selectedTemplateId === template.id && (
              <div
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--success)", color: "white" }}
              >
                <Check className="w-4 h-4" />
              </div>
            )}

            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                {template.emoji}
              </div>
              <div className="flex-1">
                <h4
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {template.name}
                </h4>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {template.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--card)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {template.type}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--card)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {template.config.model.split("-")[0]}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

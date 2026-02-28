"use client";

import { AgentDraft, AVAILABLE_MODELS, AVAILABLE_SKILLS, AVAILABLE_TOOLS, getTemplateById } from "@/lib/agent-templates";
import {
  Bot,
  Thermometer,
  Shield,
  Database,
  Globe,
  Code,
  FileText,
  Bell,
  Check,
  X,
} from "lucide-react";

interface PreviewStepProps {
  draft: AgentDraft;
}

export function PreviewStep({ draft }: PreviewStepProps) {
  const template = draft.templateId ? getTemplateById(draft.templateId) : null;
  const model = AVAILABLE_MODELS.find((m) => m.id === draft.model);

  return (
    <div className="space-y-6">
      <div>
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Review your agent
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Make sure everything looks correct before creating.
        </p>
      </div>

      {/* Agent Card Preview */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--card-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-4"
          style={{
            borderBottom: "1px solid var(--border)",
            background: `linear-gradient(135deg, var(--accent)15, transparent)`,
          }}
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
            style={{
              backgroundColor: "var(--accent)20",
              border: "2px solid var(--accent)",
            }}
          >
            {draft.emoji}
          </div>
          <div>
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              {draft.name || "Unnamed Agent"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: "var(--card)", color: "var(--text-secondary)" }}
              >
                {draft.type}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: "var(--card)", color: "var(--text-secondary)" }}
              >
                {model?.name || draft.model}
              </span>
              {template && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: "var(--accent)20", color: "var(--accent)" }}
                >
                  {template.emoji} {template.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          {/* System Prompt */}
          {draft.systemPrompt && (
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                System Prompt
              </h4>
              <p
                className="text-sm p-3 rounded-lg"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                }}
              >
                "{draft.systemPrompt.slice(0, 150)}
                {draft.systemPrompt.length > 150 ? "..." : ""}"
              </p>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Temperature */}
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Temperature: {draft.temperature?.toFixed(1) || "0.7"}
              </span>
            </div>

            {/* Memory */}
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Memory: {draft.memoryEnabled ? "Enabled" : "Disabled"}
              </span>
              {draft.memoryEnabled ? (
                <Check className="w-4 h-4" style={{ color: "var(--success)" }} />
              ) : (
                <X className="w-4 h-4" style={{ color: "var(--error)" }} />
              )}
            </div>

            {/* DM Policy */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                DM Policy: {draft.dmPolicy}
              </span>
            </div>

            {/* Max Tokens */}
            {draft.maxTokens && (
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Max Tokens: {draft.maxTokens}
                </span>
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              Features
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "webSearch", label: "Web Search", icon: Globe },
                { id: "fileAccess", label: "File Access", icon: FileText },
                { id: "codeExecution", label: "Code Execution", icon: Code },
                { id: "notifications", label: "Notifications", icon: Bell },
              ].map((feature) => {
                const isEnabled = draft.features?.[feature.id as keyof typeof draft.features];
                const Icon = feature.icon;
                return (
                  <span
                    key={feature.id}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: isEnabled ? "var(--success)20" : "var(--card)",
                      color: isEnabled ? "var(--success)" : "var(--text-muted)",
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {feature.label}
                    {isEnabled ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          {draft.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                Skills ({draft.skills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {draft.skills.map((skillId) => {
                  const skill = AVAILABLE_SKILLS.find((s) => s.id === skillId);
                  return (
                    <span
                      key={skillId}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: "var(--accent)20", color: "var(--accent)" }}
                    >
                      {skill?.name || skillId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tools */}
          {draft.tools.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                Tools ({draft.tools.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {draft.tools.map((toolId) => {
                  const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
                  return (
                    <span
                      key={toolId}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: "var(--success)20", color: "var(--success)" }}
                    >
                      {tool?.name || toolId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subagent Allowlist */}
          {draft.allowAgents.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                Can spawn subagents ({draft.allowAgents.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {draft.allowAgents.map((agentId) => (
                  <span
                    key={agentId}
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: "var(--card)", color: "var(--text-secondary)" }}
                  >
                    {agentId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning if no name */}
      {!draft.name.trim() && (
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: "var(--warning)20", color: "var(--warning)" }}
        >
          ⚠️ Agent name is required. Please go back to the Model step and add a name.
        </div>
      )}
    </div>
  );
}

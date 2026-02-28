"use client";

import { AgentDraft } from "@/lib/agent-templates";
import { Shield, Database, Bell, Globe, Code, FileText } from "lucide-react";

interface AdvancedStepProps {
  draft: AgentDraft;
  onUpdate: (updates: Partial<AgentDraft>) => void;
}

export function AdvancedStep({ draft, onUpdate }: AdvancedStepProps) {
  const toggleFeature = (feature: keyof NonNullable<AgentDraft["features"]>) => {
    onUpdate({
      features: {
        ...draft.features,
        [feature]: !draft.features?.[feature],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Advanced settings
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Fine-tune security, memory, and feature access.
        </p>
      </div>

      {/* DM Policy */}
      <div>
        <label
          className="flex items-center gap-2 text-sm font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          <Shield className="w-4 h-4" />
          Direct Message Policy
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "open", label: "Open", desc: "Anyone can message" },
            { id: "restricted", label: "Restricted", desc: "Allowed agents only" },
            { id: "isolated", label: "Isolated", desc: "No external messages" },
          ].map((policy) => (
            <button
              key={policy.id}
              onClick={() => onUpdate({ dmPolicy: policy.id as AgentDraft["dmPolicy"] })}
              className="p-3 rounded-lg text-center transition-all"
              style={{
                backgroundColor:
                  draft.dmPolicy === policy.id ? "var(--accent)15" : "var(--card-elevated)",
                border: `2px solid ${draft.dmPolicy === policy.id ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              <span
                className="font-medium text-sm"
                style={{
                  color: draft.dmPolicy === policy.id ? "var(--accent)" : "var(--text-primary)",
                }}
              >
                {policy.label}
              </span>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {policy.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Memory */}
      <div>
        <label
          className="flex items-center gap-2 text-sm font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          <Database className="w-4 h-4" />
          Memory
        </label>
        <div
          className="flex items-center justify-between p-4 rounded-lg"
          style={{ backgroundColor: "var(--card-elevated)" }}
        >
          <div>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              Enable Memory
            </span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Agent remembers context across conversations
            </p>
          </div>
          <button
            onClick={() => onUpdate({ memoryEnabled: !draft.memoryEnabled })}
            className={`w-12 h-6 rounded-full transition-colors ${
              draft.memoryEnabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                draft.memoryEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Features */}
      <div>
        <label
          className="block text-sm font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Feature Access
        </label>
        <div className="space-y-2">
          {[
            {
              id: "webSearch",
              label: "Web Search",
              desc: "Search the internet for information",
              icon: Globe,
            },
            {
              id: "fileAccess",
              label: "File Access",
              desc: "Read and write files in workspace",
              icon: FileText,
            },
            {
              id: "codeExecution",
              label: "Code Execution",
              desc: "Run code and shell commands",
              icon: Code,
            },
            {
              id: "notifications",
              label: "Notifications",
              desc: "Send notifications to users",
              icon: Bell,
            },
          ].map((feature) => {
            const isEnabled = draft.features?.[feature.id as keyof typeof draft.features];
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: "var(--card-elevated)" }}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isEnabled ? "var(--accent)" : "var(--text-muted)" }}
                  />
                  <div>
                    <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                      {feature.label}
                    </span>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeature(feature.id as keyof typeof draft.features)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    isEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subagent Allowlist */}
      <div>
        <label
          className="flex items-center gap-2 text-sm font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          <Shield className="w-4 h-4" />
          Allowed Subagents
        </label>
        <input
          type="text"
          value={draft.allowAgents.join(", ")}
          onChange={(e) =>
            onUpdate({
              allowAgents: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="agent-id-1, agent-id-2"
          className="w-full h-12 px-4 rounded-lg"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Comma-separated list of agent IDs this agent can spawn as subagents
        </p>
      </div>
    </div>
  );
}

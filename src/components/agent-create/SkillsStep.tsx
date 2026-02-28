"use client";

import { AgentDraft, AVAILABLE_SKILLS, AVAILABLE_TOOLS } from "@/lib/agent-templates";
import { Wrench, Puzzle } from "lucide-react";

interface SkillsStepProps {
  draft: AgentDraft;
  onUpdate: (updates: Partial<AgentDraft>) => void;
}

export function SkillsStep({ draft, onUpdate }: SkillsStepProps) {
  const toggleSkill = (skillId: string) => {
    const skills = draft.skills.includes(skillId)
      ? draft.skills.filter((s) => s !== skillId)
      : [...draft.skills, skillId];
    onUpdate({ skills });
  };

  const toggleTool = (toolId: string) => {
    const tools = draft.tools.includes(toolId)
      ? draft.tools.filter((t) => t !== toolId)
      : [...draft.tools, toolId];
    onUpdate({ tools });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Select capabilities
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Choose the skills and tools your agent will have access to.
        </p>
      </div>

      {/* Skills */}
      <div>
        <label
          className="flex items-center gap-2 text-sm font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          <Puzzle className="w-4 h-4" />
          Skills
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_SKILLS.map((skill) => {
            const isSelected = draft.skills.includes(skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className="p-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isSelected ? "var(--accent)15" : "var(--card-elevated)",
                  border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-medium"
                    style={{ color: isSelected ? "var(--accent)" : "var(--text-primary)" }}
                  >
                    {skill.name}
                  </span>
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? "var(--accent)" : "transparent",
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="white"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {skill.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools */}
      <div>
        <label
          className="flex items-center gap-2 text-sm font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          <Wrench className="w-4 h-4" />
          Tools
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AVAILABLE_TOOLS.map((tool) => {
            const isSelected = draft.tools.includes(tool.id);
            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className="p-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isSelected ? "var(--success)15" : "var(--card-elevated)",
                  border: `2px solid ${isSelected ? "var(--success)" : "var(--border)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-medium text-sm"
                    style={{ color: isSelected ? "var(--success)" : "var(--text-primary)" }}
                  >
                    {tool.name}
                  </span>
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? "var(--success)" : "transparent",
                      border: `1px solid ${isSelected ? "var(--success)" : "var(--border)"}`,
                    }}
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="white"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Summary */}
      {(draft.skills.length > 0 || draft.tools.length > 0) && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: "var(--card-elevated)" }}
        >
          <h4 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            Selected Capabilities
          </h4>
          <div className="flex flex-wrap gap-2">
            {draft.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: "var(--accent)20", color: "var(--accent)" }}
              >
                {AVAILABLE_SKILLS.find((s) => s.id === skill)?.name || skill}
              </span>
            ))}
            {draft.tools.map((tool) => (
              <span
                key={tool}
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: "var(--success)20", color: "var(--success)" }}
              >
                {AVAILABLE_TOOLS.find((t) => t.id === tool)?.name || tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

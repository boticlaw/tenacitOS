"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import {
  AgentDraft,
  AgentTemplate,
  AgentTemplateId,
  AGENT_TEMPLATES,
  DEFAULT_DRAFT,
  applyTemplate,
  validateDraft,
  saveDraft,
  loadDraft,
  clearDraft,
} from "@/lib/agent-templates";
import { TemplateStep } from "./agent-create/TemplateStep";
import { ModelStep } from "./agent-create/ModelStep";
import { SkillsStep } from "./agent-create/SkillsStep";
import { AdvancedStep } from "./agent-create/AdvancedStep";
import { PreviewStep } from "./agent-create/PreviewStep";

interface AgentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: AgentDraft) => Promise<void>;
}

const STEPS = [
  { id: 1, title: "Template", description: "Choose a starting point" },
  { id: 2, title: "Model", description: "Configure the model" },
  { id: 3, title: "Skills", description: "Select capabilities" },
  { id: 4, title: "Advanced", description: "Fine-tune settings" },
  { id: 5, title: "Preview", description: "Review and create" },
];

export function AgentCreateModal({ isOpen, onClose, onCreate }: AgentCreateModalProps) {
  const [draft, setDraft] = useState<AgentDraft>(DEFAULT_DRAFT);
  const [errors, setErrors] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load saved draft on mount
  useEffect(() => {
    if (isOpen) {
      const saved = loadDraft();
      if (saved) {
        setDraft(saved);
      } else {
        setDraft(DEFAULT_DRAFT);
      }
      setErrors([]);
      setCreateError(null);
    }
  }, [isOpen]);

  // Save draft on change
  useEffect(() => {
    if (isOpen) {
      saveDraft(draft);
    }
  }, [draft, isOpen]);

  const currentStep = draft.step;
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const updateDraft = useCallback((updates: Partial<AgentDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    setErrors([]);
  }, []);

  const selectTemplate = useCallback((templateId: AgentTemplateId) => {
    const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setDraft((prev) => ({
        ...applyTemplate(prev, template),
        step: 2, // Move to next step
      }));
    }
  }, []);

  const goNext = useCallback(() => {
    const validation = validateDraft(draft, currentStep);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (currentStep < 5) {
      setDraft((prev) => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 | 4 | 5 }));
    }
  }, [draft, currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setDraft((prev) => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 | 4 | 5 }));
    }
  }, [currentStep]);

  const handleCreate = useCallback(async () => {
    const validation = validateDraft(draft, currentStep);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await onCreate(draft);
      clearDraft();
      onClose();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create agent");
    } finally {
      setIsCreating(false);
    }
  }, [draft, currentStep, onCreate, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && e.ctrlKey) {
        if (currentStep === 5) {
          handleCreate();
        } else {
          goNext();
        }
      }
    },
    [currentStep, goNext, handleCreate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              <Sparkles className="inline-block w-5 h-5 mr-2" style={{ color: "var(--accent)" }} />
              Create New Agent
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {STEPS[currentStepIndex].description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--card-elevated)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (step.id <= Math.max(...STEPS.slice(0, currentStepIndex).map((s) => s.id))) {
                      setDraft((prev) => ({ ...prev, step: step.id as 1 | 2 | 3 | 4 | 5 }));
                    }
                  }}
                  className="flex items-center gap-2"
                  disabled={step.id > currentStep}
                  style={{
                    opacity: step.id <= currentStep ? 1 : 0.5,
                    cursor: step.id <= currentStep ? "pointer" : "default",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor:
                        step.id < currentStep
                          ? "var(--success)"
                          : step.id === currentStep
                          ? "var(--accent)"
                          : "var(--card-elevated)",
                      color:
                        step.id <= currentStep ? "white" : "var(--text-muted)",
                    }}
                  >
                    {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span
                    className="hidden sm:block text-sm"
                    style={{
                      color:
                        step.id === currentStep
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                      fontWeight: step.id === currentStep ? 600 : 400,
                    }}
                  >
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className="w-8 sm:w-12 h-0.5 mx-1"
                    style={{
                      backgroundColor:
                        step.id < currentStep ? "var(--success)" : "var(--border)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 200px)" }}>
          {errors.length > 0 && (
            <div
              className="mb-4 p-3 rounded-lg"
              style={{ backgroundColor: "var(--error)20", color: "var(--error)" }}
            >
              {errors.map((error, i) => (
                <p key={i} className="text-sm">
                  • {error}
                </p>
              ))}
            </div>
          )}

          {createError && (
            <div
              className="mb-4 p-3 rounded-lg"
              style={{ backgroundColor: "var(--error)20", color: "var(--error)" }}
            >
              {createError}
            </div>
          )}

          {currentStep === 1 && (
            <TemplateStep
              selectedTemplateId={draft.templateId}
              onSelect={selectTemplate}
            />
          )}

          {currentStep === 2 && (
            <ModelStep
              draft={draft}
              onUpdate={updateDraft}
            />
          )}

          {currentStep === 3 && (
            <SkillsStep draft={draft} onUpdate={updateDraft} />
          )}

          {currentStep === 4 && (
            <AdvancedStep draft={draft} onUpdate={updateDraft} />
          )}

          {currentStep === 5 && (
            <PreviewStep draft={draft} />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--card-elevated)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Draft saved automatically • Ctrl+Enter to continue
          </div>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--card)",
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {currentStep < 5 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                }}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--success)",
                  color: "white",
                  opacity: isCreating ? 0.7 : 1,
                }}
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Agent
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

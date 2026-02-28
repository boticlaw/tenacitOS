"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, Plus, FileJson, Loader2, AlertCircle, Layers, Edit3 } from "lucide-react";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { WORKFLOW_TEMPLATES, createWorkflowFromTemplate } from "@/lib/workflow-templates";
import type { Workflow } from "@/lib/workflow-templates";

type ViewMode = "list" | "designer";

export default function WorkflowsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch {
      setError("Failed to load workflows");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreateFromTemplate = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const workflow = createWorkflowFromTemplate(template);
    setSelectedWorkflow(workflow);
    setViewMode("designer");
  };

  const handleSave = async () => {
    if (!selectedWorkflow) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: selectedWorkflow.id.startsWith("workflow-") ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedWorkflow),
      });
      const data = await res.json();
      if (data.workflow) {
        setSelectedWorkflow(data.workflow);
        fetchWorkflows();
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedWorkflow) return;
    setIsExecuting(true);
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}/execute`, {
        method: "POST",
      });
      const data = await res.json();
      console.log("Execution started:", data);
    } catch (err) {
      console.error("Failed to execute:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExport = (workflow: Workflow) => {
    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {viewMode === "list" ? (
        <>
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
                  <GitBranch style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
                  Workflow Designer
                </h1>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Diseña workflows visuales para automatización multi-agente
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedWorkflow({
                    id: `workflow-${Date.now()}`,
                    name: "New Workflow",
                    description: "",
                    nodes: [{ id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Start" } }],
                    edges: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isTemplate: false,
                    status: "draft",
                  });
                  setViewMode("designer");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  backgroundColor: "var(--accent)",
                  border: "none",
                  borderRadius: "8px",
                  color: "var(--bg)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <Plus size={16} />
                New Workflow
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 24px 24px" }}>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-muted)" }}>
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--error)" }}>
                <AlertCircle size={24} style={{ marginRight: "8px" }} />
                {error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "24px" }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "12px",
                    }}
                  >
                    Templates
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                    {WORKFLOW_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        style={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          padding: "16px",
                          cursor: "pointer",
                          transition: "all 150ms ease",
                        }}
                        onClick={() => handleCreateFromTemplate(template.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              backgroundColor: "var(--accent-soft)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--accent)",
                            }}
                          >
                            <Layers size={16} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                            {template.name}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                          {template.description}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                          <span>{template.nodes.length} nodes</span>
                          <span>·</span>
                          <span>{template.edges.length} connections</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {workflows.length > 0 && (
                  <div>
                    <h2
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: "12px",
                      }}
                    >
                      Your Workflows
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {workflows.map((workflow) => (
                        <div
                          key={workflow.id}
                          style={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                              {workflow.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              {workflow.nodes.length} nodes · {workflow.status}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                setSelectedWorkflow(workflow);
                                setViewMode("designer");
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                backgroundColor: "var(--surface-hover)",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                            >
                              <Edit3 size={12} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleExport(workflow)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                backgroundColor: "transparent",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                            >
                              <FileJson size={12} />
                              Export
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                ← Back
              </button>
              <input
                type="text"
                value={selectedWorkflow?.name || ""}
                onChange={(e) =>
                  setSelectedWorkflow((prev) => (prev ? { ...prev, name: e.target.value } : null))
                }
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  backgroundColor: selectedWorkflow?.status === "active" ? "var(--success)" : "var(--warning)",
                  borderRadius: "4px",
                  color: "var(--bg)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {selectedWorkflow?.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                value={selectedWorkflow?.status || "draft"}
                onChange={(e) =>
                  setSelectedWorkflow((prev) =>
                    prev ? { ...prev, status: e.target.value as "draft" | "active" | "archived" } : null
                  )
                }
                style={{
                  padding: "6px 12px",
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {selectedWorkflow && (
              <WorkflowCanvas
                workflow={selectedWorkflow}
                onChange={setSelectedWorkflow}
                onSave={handleSave}
                onExecute={handleExecute}
                isSaving={isSaving}
                isExecuting={isExecuting}
              />
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

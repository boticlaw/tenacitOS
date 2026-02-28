"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  Panel,
  ReactFlowProvider,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, Save, X } from "lucide-react";
import type { Workflow, WorkflowNode, NodeType, TaskType } from "@/lib/workflow-templates";

const NODE_COLORS: Record<NodeType, string> = {
  trigger: "#10b981",
  task: "#3b82f6",
  condition: "#f59e0b",
  parallel: "#8b5cf6",
  join: "#ec4899",
  delay: "#6366f1",
};

const TASK_ICONS: Record<TaskType, string> = {
  research: "🔍",
  code: "💻",
  review: "👀",
  deploy: "🚀",
  notify: "📧",
  analyze: "📊",
};

interface WorkflowCanvasProps {
  workflow: Workflow;
  onChange?: (workflow: Workflow) => void;
  onSave?: () => void;
  onExecute?: () => void;
  isSaving?: boolean;
  isExecuting?: boolean;
}

function TriggerNode({ data }: { data: WorkflowNode["data"] }) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderRadius: "20px",
        backgroundColor: NODE_COLORS.trigger,
        color: "#fff",
        fontWeight: 600,
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span>▶</span>
      {data.label}
    </div>
  );
}

function TaskNode({ data }: { data: WorkflowNode["data"] }) {
  const icon = data.taskType ? TASK_ICONS[data.taskType] : "⚙";
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor: "var(--card)",
        border: `2px solid ${NODE_COLORS.task}`,
        minWidth: "120px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>{data.label}</span>
      </div>
      {data.description && (
        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{data.description}</div>
      )}
    </div>
  );
}

function ConditionNode() {
  return (
    <div
      style={{
        width: "60px",
        height: "60px",
        transform: "rotate(45deg)",
        backgroundColor: "var(--card)",
        border: `2px solid ${NODE_COLORS.condition}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ transform: "rotate(-45deg)", fontSize: "10px", fontWeight: 600, color: "var(--text-primary)" }}>
        IF
      </span>
    </div>
  );
}

function ParallelNode({ data }: { data: WorkflowNode["data"] }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "6px",
        backgroundColor: NODE_COLORS.parallel,
        color: "#fff",
        fontWeight: 600,
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span>⫿</span>
      {data.label}
    </div>
  );
}

function JoinNode({ data }: { data: WorkflowNode["data"] }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "6px",
        backgroundColor: NODE_COLORS.join,
        color: "#fff",
        fontWeight: 600,
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span>⫯</span>
      {data.label}
    </div>
  );
}

function DelayNode({ data }: { data: WorkflowNode["data"] }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        backgroundColor: "var(--card)",
        border: `2px solid ${NODE_COLORS.delay}`,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 500,
        color: "var(--text-primary)",
      }}
    >
      <span>⏱</span>
      {data.delayMinutes || 0}m
    </div>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  task: TaskNode,
  condition: ConditionNode,
  parallel: ParallelNode,
  join: JoinNode,
  delay: DelayNode,
};

function Canvas({ workflow, onChange, onSave, onExecute, isSaving, isExecuting }: WorkflowCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const initialNodes: Node[] = useMemo(
    () =>
      workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
    [workflow.nodes]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      workflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: true,
        style: { stroke: "var(--accent)", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--accent)" },
      })),
    [workflow.edges]
  );

  const [nodes,, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: `e-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null,
        animated: true,
        style: { stroke: "var(--accent)", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--accent)" },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      const newWorkflowEdge = {
        id: `e-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
      };
      onChange?.({
        ...workflow,
        edges: [...workflow.edges, newWorkflowEdge],
      });
    },
    [setEdges, workflow, onChange]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const wfNode = workflow.nodes.find((n) => n.id === node.id);
      setSelectedNode(wfNode || null);
    },
    [workflow.nodes]
  );

  const handleSave = () => {
    const updatedNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type as NodeType,
      position: n.position,
      data: n.data as WorkflowNode["data"],
    }));
    const updatedEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label as string | undefined,
    }));
    onChange?.({ ...workflow, nodes: updatedNodes, edges: updatedEdges });
    onSave?.();
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: "var(--bg)" }}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls />

        <Panel position="top-left" style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "var(--accent)",
              border: "none",
              borderRadius: "6px",
              color: "var(--bg)",
              cursor: isSaving ? "wait" : "pointer",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onExecute}
            disabled={isExecuting || workflow.status !== "active"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "var(--success)",
              border: "none",
              borderRadius: "6px",
              color: "var(--bg)",
              cursor: isExecuting ? "wait" : "pointer",
              fontSize: "12px",
              fontWeight: 500,
              opacity: workflow.status !== "active" ? 0.5 : 1,
            }}
          >
            <Play size={14} />
            {isExecuting ? "Running..." : "Execute"}
          </button>
        </Panel>

        <Panel position="bottom-left">
          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            {workflow.nodes.length} nodes · {workflow.edges.length} connections
          </div>
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <div
          style={{
            position: "absolute",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "260px",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Node Properties</span>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Type
              </label>
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: NODE_COLORS[selectedNode.type],
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {selectedNode.type}
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Label
              </label>
              <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>{selectedNode.data.label}</div>
            </div>
            {selectedNode.data.description && (
              <div>
                <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Description
                </label>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {selectedNode.data.description}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

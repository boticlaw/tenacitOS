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
  MarkerType,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Bot, Cpu, AlertTriangle, CheckCircle, Clock, MessageSquare, Filter, X } from "lucide-react";
import type { CommunicationGraph as CGraph, AgentNode, CommunicationEdge, MessageType } from "@/lib/communication-aggregator";

const MESSAGE_TYPE_COLORS: Record<MessageType, string> = {
  task: "#3b82f6",
  result: "#10b981",
  error: "#ef4444",
  status: "#f59e0b",
  query: "#8b5cf6",
};

interface CommunicationGraphProps {
  data: CGraph;
  onEdgeClick?: (edge: CommunicationEdge) => void;
  filters?: {
    messageTypes: MessageType[];
  };
  onFilterChange?: (filters: { messageTypes: MessageType[] }) => void;
}

function MainNode({ data }: { data: { node: AgentNode; highlighted: boolean } }) {
  const { node, highlighted } = data;
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "12px",
        backgroundColor: highlighted ? "var(--accent)" : "var(--card-elevated)",
        border: `2px solid ${highlighted ? "var(--accent)" : "var(--accent)"}`,
        boxShadow: highlighted ? "0 0 20px var(--accent)50" : "0 4px 12px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: "120px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--bg)",
        }}
      >
        <Cpu size={18} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: "13px", color: highlighted ? "var(--bg)" : "var(--text-primary)" }}>
          {node.name}
        </div>
        <div style={{ fontSize: "10px", color: highlighted ? "var(--bg)80" : "var(--text-muted)" }}>
          {node.messageCount} messages
        </div>
      </div>
    </div>
  );
}

function SubagentNode({ data }: { data: { node: AgentNode; highlighted: boolean } }) {
  const { node, highlighted } = data;
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "10px",
        backgroundColor: highlighted ? "var(--accent-soft)" : "var(--card)",
        border: `1px solid ${highlighted ? "var(--accent)" : "var(--border)"}`,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "100px",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          backgroundColor: "var(--surface-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent)",
        }}
      >
        <Bot size={14} />
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: "12px", color: "var(--text-primary)" }}>{node.name}</div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{node.messageCount} msgs</div>
      </div>
    </div>
  );
}

const nodeTypes = {
  main: MainNode,
  subagent: SubagentNode,
};

function GraphCanvas({ data, onEdgeClick, filters, onFilterChange }: CommunicationGraphProps) {
  const [selectedEdge, setSelectedEdge] = useState<CommunicationEdge | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    const mainIndex = data.nodes.findIndex((n) => n.type === "main");
    const subagents = data.nodes.filter((n) => n.type !== "main");

    const nodes: Node[] = data.nodes.map((node, index) => {
      let position;
      if (node.type === "main") {
        position = { x: centerX, y: centerY };
      } else {
        const subIndex = index > mainIndex ? index - 1 : index;
        const angle = (subIndex / subagents.length) * Math.PI * 2 - Math.PI / 2;
        position = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      }

      return {
        id: node.id,
        type: node.type === "main" ? "main" : "subagent",
        position,
        data: {
          node,
          highlighted: false,
        },
      };
    });

    const maxCount = Math.max(...data.edges.map((e) => e.messageCount), 1);
    const edges: Edge[] = data.edges.map((edge) => {
      const thickness = 1 + (edge.messageCount / maxCount) * 4;
      const dominantType = Object.entries(edge.messageTypes).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0] as MessageType;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: {
          stroke: MESSAGE_TYPE_COLORS[dominantType],
          strokeWidth: thickness,
          opacity: 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: MESSAGE_TYPE_COLORS[dominantType],
        },
      };
    });

    return { nodes, edges };
  }, [data]);

  const [nodes,, onNodesChange] = useNodesState(initialNodes);
  const [edges,, onEdgesChange] = useEdgesState(initialEdges);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const commEdge = data.edges.find((e) => e.id === edge.id);
      if (commEdge) {
        setSelectedEdge(commEdge);
        onEdgeClick?.(commEdge);
      }
    },
    [data.edges, onEdgeClick]
  );

  const toggleFilter = (type: MessageType) => {
    if (!filters || !onFilterChange) return;
    
    const newTypes = filters.messageTypes.includes(type)
      ? filters.messageTypes.filter((t) => t !== type)
      : [...filters.messageTypes, type];
    
    onFilterChange({ messageTypes: newTypes });
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ background: "var(--bg)" }}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls />

        <Panel position="top-left" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            {data.nodes.length} agents · {data.edges.length} connections
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: showFilters ? "var(--accent-soft)" : "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: showFilters ? "var(--accent)" : "var(--text-primary)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <Filter size={14} />
            Filters
          </button>
        </Panel>

        {showFilters && (
          <Panel position="top-right">
            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "12px",
                minWidth: "150px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                Message Types
              </div>
              {(["task", "result", "error", "status", "query"] as MessageType[]).map((type) => {
                const isActive = !filters || filters.messageTypes.length === 0 || filters.messageTypes.includes(type);
                const count = data.edges.reduce((sum, e) => sum + e.messageTypes[type], 0);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "6px 8px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      color: isActive ? MESSAGE_TYPE_COLORS[type] : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "12px",
                      opacity: isActive ? 1 : 0.5,
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>{type}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
        )}

        <Panel position="bottom-left">
          <div style={{ display: "flex", gap: "12px" }}>
            {Object.entries(MESSAGE_TYPE_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "3px", backgroundColor: color, borderRadius: "2px" }} />
                <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {type}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>

      {selectedEdge && (
        <div
          style={{
            position: "absolute",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "280px",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            zIndex: 10,
            overflow: "hidden",
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={16} style={{ color: "var(--accent)" }} />
              <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                Communication
              </span>
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{selectedEdge.source}</span>
              <span style={{ color: "var(--text-muted)" }}>→</span>
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{selectedEdge.target}</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Total Messages</div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {selectedEdge.messageCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Last Active</div>
                <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                  {selectedEdge.lastMessage ? new Date(selectedEdge.lastMessage).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>By Type</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(selectedEdge.messageTypes).map(([type, count]) => (
                  <div
                    key={type}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      backgroundColor: "var(--surface-hover)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {type === "error" ? (
                        <AlertTriangle size={12} style={{ color: MESSAGE_TYPE_COLORS[type as MessageType] }} />
                      ) : type === "result" ? (
                        <CheckCircle size={12} style={{ color: MESSAGE_TYPE_COLORS[type as MessageType] }} />
                      ) : (
                        <Clock size={12} style={{ color: MESSAGE_TYPE_COLORS[type as MessageType] }} />
                      )}
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                        {type}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommunicationGraphComponent(props: CommunicationGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  );
}

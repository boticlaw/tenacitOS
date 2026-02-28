"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Search, Download, X, Filter, Users, Code, Lightbulb, Link2, Calendar } from "lucide-react";
import type { EntityType, Entity, Relation, KnowledgeGraph } from "@/lib/memory-parser";

const TYPE_COLORS: Record<EntityType, string> = {
  person: "#3b82f6",
  project: "#8b5cf6",
  technology: "#10b981",
  concept: "#f59e0b",
  resource: "#ef4444",
  date: "#6366f1",
  location: "#ec4899",
};

const TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  person: <Users size={12} />,
  project: <Code size={12} />,
  technology: <Code size={12} />,
  concept: <Lightbulb size={12} />,
  resource: <Link2 size={12} />,
  date: <Calendar size={12} />,
  location: <Code size={12} />,
};

interface KnowledgeGraphProps {
  data: KnowledgeGraph;
}

interface SelectedNode {
  entity: Entity;
  connections: Array<{ entity: Entity; relation: Relation }>;
}

function CustomNode({ data }: { data: { entity: Entity; highlighted: boolean } }) {
  const { entity, highlighted } = data;
  const color = TYPE_COLORS[entity.type];
  const icon = TYPE_ICONS[entity.type];

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: "8px",
        backgroundColor: highlighted ? color : "var(--card)",
        border: `2px solid ${color}`,
        boxShadow: highlighted ? `0 0 20px ${color}50` : "none",
        fontSize: "12px",
        fontWeight: 500,
        color: highlighted ? "#fff" : "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 150ms ease",
        minWidth: "60px",
        maxWidth: "150px",
      }}
    >
      <span style={{ opacity: 0.8 }}>{icon}</span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entity.name}
      </span>
      {entity.mentions > 1 && (
        <span
          style={{
            fontSize: "10px",
            opacity: 0.6,
            marginLeft: "2px",
          }}
        >
          {entity.mentions}
        </span>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function GraphCanvas({ data }: KnowledgeGraphProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(new Set());
  const { fitView } = useReactFlow();

  const filteredEntities = useMemo(() => {
    let entities = data.entities;
    if (activeFilters.size > 0) {
      entities = entities.filter((e) => activeFilters.has(e.type));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entities = entities.filter((e) => e.name.toLowerCase().includes(query));
    }
    return entities;
  }, [data.entities, activeFilters, searchQuery]);

  const entityIds = useMemo(() => new Set(filteredEntities.map((e) => e.id)), [filteredEntities]);

  const filteredRelations = useMemo(() => {
    return data.relations.filter((r) => entityIds.has(r.source) && entityIds.has(r.target));
  }, [data.relations, entityIds]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodeMap = new Map<string, { x: number; y: number }>();
    const centerX = 400;
    const centerY = 300;
    const radius = 250;

    const typeGroups = new Map<EntityType, Entity[]>();
    filteredEntities.forEach((e) => {
      if (!typeGroups.has(e.type)) {
        typeGroups.set(e.type, []);
      }
      typeGroups.get(e.type)!.push(e);
    });

    let angleOffset = 0;
    typeGroups.forEach((entities) => {
      const typeAngle = angleOffset;
      entities.forEach((entity, i) => {
        const angle = typeAngle + (i / entities.length) * (Math.PI * 2 / Array.from(typeGroups.keys()).length);
        const r = radius + (entity.mentions * 10);
        nodeMap.set(entity.id, {
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
        });
      });
      angleOffset += Math.PI * 2 / Array.from(typeGroups.keys()).length;
    });

    const nodes: Node[] = filteredEntities.map((entity) => ({
      id: entity.id,
      type: "custom",
      position: nodeMap.get(entity.id) || { x: centerX, y: centerY },
      data: {
        entity,
        highlighted: searchQuery && entity.name.toLowerCase().includes(searchQuery.toLowerCase()),
      },
    }));

    const edges: Edge[] = filteredRelations.map((relation) => ({
      id: relation.id,
      source: relation.source,
      target: relation.target,
      animated: false,
      style: {
        stroke: "var(--border)",
        strokeWidth: Math.min(1 + relation.weight * 0.5, 4),
        opacity: 0.4,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--border)",
      },
    }));

    return { nodes, edges };
  }, [filteredEntities, filteredRelations, searchQuery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    fitView({ padding: 0.2 });
  }, [fitView, filteredEntities.length]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const entity = data.entities.find((e) => e.id === node.id);
      if (!entity) return;

      const connections = data.relations
        .filter((r) => r.source === entity.id || r.target === entity.id)
        .map((r) => {
          const connectedId = r.source === entity.id ? r.target : r.source;
          const connectedEntity = data.entities.find((e) => e.id === connectedId);
          return connectedEntity ? { entity: connectedEntity, relation: r } : null;
        })
        .filter(Boolean) as Array<{ entity: Entity; relation: Relation }>;

      setSelectedNode({ entity, connections });
    },
    [data.entities, data.relations]
  );

  const toggleFilter = (type: EntityType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleExport = async () => {
    const canvas = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!canvas) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const pngCanvas = await html2canvas(canvas, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--bg") || "#111",
      });
      const link = document.createElement("a");
      link.download = "knowledge-graph.png";
      link.href = pngCanvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const availableTypes = useMemo(() => {
    const types = new Set<EntityType>();
    data.entities.forEach((e) => types.add(e.type));
    return Array.from(types);
  }, [data.entities]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: "var(--bg)" }}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls />

        <Panel position="top-left" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          >
            <Search size={16} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "13px",
                width: "150px",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={handleExport}
            title="Export as PNG"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <Download size={16} />
            Export
          </button>
        </Panel>

        <Panel position="top-right">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Filter size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>FILTERS</span>
            </div>
            {availableTypes.map((type) => {
              const isActive = activeFilters.size === 0 || activeFilters.has(type);
              const count = data.entities.filter((e) => e.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    backgroundColor: isActive ? "var(--surface-hover)" : "transparent",
                    border: "1px solid",
                    borderColor: isActive ? TYPE_COLORS[type] : "var(--border)",
                    borderRadius: "6px",
                    color: isActive ? TYPE_COLORS[type] : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "12px",
                    transition: "all 150ms ease",
                  }}
                >
                  {TYPE_ICONS[type]}
                  <span style={{ textTransform: "capitalize" }}>{type}</span>
                  <span style={{ marginLeft: "auto", opacity: 0.6 }}>{count}</span>
                </button>
              );
            })}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                style={{
                  padding: "6px 8px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "11px",
                  marginTop: "4px",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </Panel>

        <Panel position="bottom-left">
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
            {filteredEntities.length} entities, {filteredRelations.length} connections
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
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span style={{ color: TYPE_COLORS[selectedNode.entity.type] }}>
                  {TYPE_ICONS[selectedNode.entity.type]}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: TYPE_COLORS[selectedNode.entity.type],
                  }}
                >
                  {selectedNode.entity.type}
                </span>
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {selectedNode.entity.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Mentions</div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {selectedNode.entity.mentions}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Connections</div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {selectedNode.connections.length}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Sources</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {selectedNode.entity.sources.slice(0, 5).map((source) => (
                  <span
                    key={source}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      backgroundColor: "var(--surface-hover)",
                      borderRadius: "4px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {source}
                  </span>
                ))}
                {selectedNode.entity.sources.length > 5 && (
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      color: "var(--text-muted)",
                    }}
                  >
                    +{selectedNode.entity.sources.length - 5} more
                  </span>
                )}
              </div>
            </div>

            {selectedNode.connections.length > 0 && (
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Related entities
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                  {selectedNode.connections.slice(0, 10).map(({ entity, relation }) => (
                    <div
                      key={entity.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        backgroundColor: "var(--surface-hover)",
                        borderRadius: "6px",
                      }}
                    >
                      <span style={{ color: TYPE_COLORS[entity.type] }}>{TYPE_ICONS[entity.type]}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-primary)", flex: 1 }}>{entity.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>×{relation.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.entity.metadata?.url && (
              <div style={{ marginTop: "16px" }}>
                <a
                  href={selectedNode.entity.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "var(--accent)",
                    textDecoration: "none",
                  }}
                >
                  <Link2 size={12} />
                  Open link
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function KnowledgeGraphComponent({ data }: KnowledgeGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvas data={data} />
    </ReactFlowProvider>
  );
}

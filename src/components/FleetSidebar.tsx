"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Play,
  Pause,
  FileText,
  Activity,
  Bot,
  Clock,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Agent {
  id: string;
  key: string;
  type: "main" | "cron" | "subagent" | "direct" | "unknown";
  model: string;
  status: "running" | "idle" | "error";
  lastActivity: string;
  tokensUsed: number;
}

interface FleetSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

type StatusFilter = "all" | "running" | "idle" | "error";
type TypeFilter = "all" | "main" | "cron" | "subagent" | "direct";

export function FleetSidebar({ isOpen, onToggle }: FleetSidebarProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        
        const mappedAgents: Agent[] = (data.sessions || []).map((s: any) => ({
          id: s.id,
          key: s.key,
          type: s.type || "unknown",
          model: s.model || "unknown",
          status: s.aborted ? "error" : s.lastActivity ? "running" : "idle",
          lastActivity: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
          tokensUsed: s.totalTokens || 0,
        }));
        
        setAgents(mappedAgents);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !agent.key.toLowerCase().includes(query) &&
          !agent.model.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && agent.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && agent.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [agents, searchQuery, statusFilter, typeFilter]);

  const handleQuickAction = async (agentKey: string, action: "pause" | "resume" | "logs" | "activity") => {
    // Implement quick actions
    console.log(`Action ${action} for agent ${agentKey}`);
  };

  const statusColors = {
    running: "var(--success)",
    idle: "var(--text-muted)",
    error: "var(--error)",
  };

  const typeColors = {
    main: "var(--accent)",
    cron: "#a78bfa",
    subagent: "#60a5fa",
    direct: "#4ade80",
    unknown: "var(--text-muted)",
  };

  return (
    <>
      {/* Collapsed toggle button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          style={{
            position: "fixed",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            padding: "0.75rem 0.5rem",
            backgroundColor: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            borderRight: "none",
            borderRadius: "0.5rem 0 0 0.5rem",
            cursor: "pointer",
            zIndex: 40,
          }}
          title="Open Fleet Sidebar"
        >
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
        </button>
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          right: isOpen ? 0 : "-320px",
          top: 0,
          width: "320px",
          height: "100vh",
          backgroundColor: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          transition: "right 0.3s ease",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bot style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Fleet</span>
            <span
              style={{
                padding: "0.125rem 0.5rem",
                backgroundColor: "var(--accent)",
                color: "white",
                borderRadius: "9999px",
                fontSize: "0.625rem",
                fontWeight: 600,
              }}
            >
              {agents.length}
            </span>
          </div>
          <button
            onClick={onToggle}
            style={{
              padding: "0.25rem",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <ChevronRight style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: "var(--surface-elevated)",
              borderRadius: "0.5rem",
            }}
          >
            <Search style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  padding: "0.125rem",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: "12px", height: "12px", color: "var(--text-muted)" }} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              marginTop: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.375rem 0.75rem",
              backgroundColor: showFilters ? "var(--surface-elevated)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
            }}
          >
            <Filter style={{ width: "12px", height: "12px" }} />
            Filters
            {(statusFilter !== "all" || typeFilter !== "all") && (
              <span
                style={{
                  padding: "0.125rem 0.375rem",
                  backgroundColor: "var(--accent)",
                  color: "white",
                  borderRadius: "9999px",
                  fontSize: "0.625rem",
                }}
              >
                {(statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Filters panel */}
          {showFilters && (
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "var(--surface-elevated)",
                borderRadius: "0.5rem",
              }}
            >
              <div style={{ marginBottom: "0.75rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Status
                </label>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {(["all", "running", "idle", "error"] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      style={{
                        padding: "0.25rem 0.625rem",
                        backgroundColor:
                          statusFilter === status ? "var(--accent)" : "transparent",
                        color: statusFilter === status ? "white" : "var(--text-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                        fontSize: "0.6875rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    marginBottom: "0.375rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Type
                </label>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {(["all", "main", "cron", "subagent", "direct"] as TypeFilter[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      style={{
                        padding: "0.25rem 0.625rem",
                        backgroundColor:
                          typeFilter === type ? "var(--accent)" : "transparent",
                        color: typeFilter === type ? "white" : "var(--text-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                        fontSize: "0.6875rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Agents list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              Loading...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              No agents found
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "var(--surface-elevated)",
                  borderRadius: "0.5rem",
                  marginBottom: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--card-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.375rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: statusColors[agent.status],
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {agent.key.split("/").pop()}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      padding: "0.125rem 0.375rem",
                      backgroundColor: typeColors[agent.type],
                      color: "white",
                      borderRadius: "0.25rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {agent.type}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.375rem",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>{agent.model.split("/").pop()}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(agent.lastActivity))}</span>
                </div>

                {/* Quick actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.25rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(agent.key, agent.status === "running" ? "pause" : "resume");
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      padding: "0.375rem",
                      backgroundColor: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.625rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {agent.status === "running" ? (
                      <>
                        <Pause style={{ width: "10px", height: "10px" }} />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play style={{ width: "10px", height: "10px" }} />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(agent.key, "logs");
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      padding: "0.375rem",
                      backgroundColor: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.625rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <FileText style={{ width: "10px", height: "10px" }} />
                    Logs
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(agent.key, "activity");
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      padding: "0.375rem",
                      backgroundColor: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.625rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Activity style={{ width: "10px", height: "10px" }} />
                    Activity
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

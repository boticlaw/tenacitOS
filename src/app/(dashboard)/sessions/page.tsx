"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageSquare,
  Clock,
  Bot,
  RefreshCw,
  X,
  ChevronRight,
  Wrench,
  User,
  AlertTriangle,
  Search,
  Cpu,
  TrendingUp,
  Hash,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  key: string;
  type: "main" | "cron" | "subagent" | "direct" | "unknown";
  typeLabel: string;
  typeEmoji: string;
  sessionId: string | null;
  cronJobId?: string;
  subagentId?: string;
  updatedAt: number;
  ageMs: number;
  model: string;
  modelProvider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  contextTokens: number;
  contextUsedPercent: number | null;
  aborted: boolean;
}

interface Message {
  id: string;
  type: "user" | "assistant" | "tool_use" | "tool_result" | "model_change" | "system";
  role?: string;
  content: string;
  timestamp: string;
  model?: string;
  toolName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function shortModel(model: string): string {
  // claude-sonnet-4-5 → Sonnet 4.5
  // claude-opus-4-6 → Opus 4.6
  // claude-haiku-3-5 → Haiku 3.5
  const m = model.replace("anthropic/", "").replace("claude-", "");
  const parts = m.split("-");
  if (parts.length >= 2) {
    const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const ver = parts.slice(1).join(".");
    return `${name} ${ver}`;
  }
  return model;
}

function typeColor(type: Session["type"]): string {
  switch (type) {
    case "main": return "var(--accent)";
    case "cron": return "#a78bfa";
    case "subagent": return "#60a5fa";
    case "direct": return "#4ade80";
    default: return "var(--text-muted)";
  }
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.type === "user";
  const isTool = msg.type === "tool_use";
  const isResult = msg.type === "tool_result";
  const isAssistant = msg.type === "assistant";

  if (isTool) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          borderRadius: "0.5rem",
          backgroundColor: "rgba(96,165,250,0.08)",
          border: "1px solid rgba(96,165,250,0.2)",
          marginBottom: "0.5rem",
          fontSize: "0.78rem",
          fontFamily: "monospace",
        }}
      >
        <Wrench style={{ width: "13px", height: "13px", color: "#60a5fa", flexShrink: 0, marginTop: "2px" }} />
        <span style={{ color: "#60a5fa", fontWeight: 600, flexShrink: 0 }}>
          {msg.toolName}
        </span>
        <span style={{ color: "var(--text-muted)", wordBreak: "break-all" }}>
          {msg.content.replace(`${msg.toolName}(`, "").replace(/\)$/, "").slice(0, 200)}
        </span>
      </div>
    );
  }

  if (isResult) {
    return (
      <div
        style={{
          padding: "0.375rem 0.75rem",
          borderRadius: "0.375rem",
          backgroundColor: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.15)",
          marginBottom: "0.5rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          fontFamily: "monospace",
          maxHeight: "3rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        ↳ {msg.content}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "0.625rem",
        marginBottom: "0.75rem",
        alignItems: "flex-start",
        flexDirection: isUser ? "row-reverse" : "row",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "12px",
          backgroundColor: isUser ? "var(--accent)" : "var(--card-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "11px",
        }}
      >
        {isUser ? (
          <User style={{ width: "12px", height: "12px", color: "var(--bg, #000)" }} />
        ) : (
          <Bot style={{ width: "12px", height: "12px", color: "var(--accent)" }} />
        )}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "78%",
          padding: "0.5rem 0.75rem",
          borderRadius: isUser ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
          backgroundColor: isUser
            ? "rgba(255,59,48,0.12)"
            : "var(--card-elevated)",
          border: `1px solid ${isUser ? "rgba(255,59,48,0.2)" : "var(--border)"}`,
          fontSize: "0.82rem",
          lineHeight: "1.5",
          color: "var(--text-primary)",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content.length > 800
          ? msg.content.slice(0, 800) + "\n…(truncated)"
          : msg.content}
      </div>
    </div>
  );
}

// ─── Session Detail Panel ────────────────────────────────────────────────────

function SessionDetail({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetchState, setFetchState] = useState<"loading" | "error" | "success">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const prevSessionIdRef = useRef<string | null>(null);

  const hasNoSession = !session.sessionId;

  useEffect(() => {
    if (!session.sessionId) {
      return;
    }

    if (prevSessionIdRef.current === session.sessionId) {
      return;
    }
    prevSessionIdRef.current = session.sessionId;

    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => {
      setFetchState("loading");
      setErrorMessage(null);
    }, 0);
    
    fetch(`/api/sessions?id=${session.sessionId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages || []);
        if (data.error) {
          setFetchState("error");
          setErrorMessage(data.error);
        } else {
          setFetchState("success");
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setFetchState("error");
          setErrorMessage("Failed to load messages");
        }
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [session.sessionId]);

  const loading = hasNoSession ? false : fetchState === "loading";
  const error = hasNoSession ? "No session file available" : errorMessage;

  const userCount = messages.filter((m) => m.type === "user").length;
  const assistantCount = messages.filter((m) => m.type === "assistant").length;
  const toolCount = messages.filter((m) => m.type === "tool_use").length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(640px, 100vw)",
          height: "100%",
          backgroundColor: "var(--card)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.25rem" }}>{session.typeEmoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: `color-mix(in srgb, ${typeColor(session.type)} 15%, transparent)`,
                    color: typeColor(session.type),
                  }}
                >
                  {session.typeLabel}
                </span>
                {session.aborted && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(239,68,68,0.15)",
                      color: "var(--error)",
                    }}
                  >
                    ⚠ Aborted
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginTop: "0.2rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.key}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "0.375rem",
                borderRadius: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { icon: Cpu, label: shortModel(session.model), color: "#a78bfa" },
              { icon: Hash, label: `${formatTokens(session.totalTokens)} tokens`, color: "var(--accent)" },
              {
                icon: TrendingUp,
                label: session.contextUsedPercent !== null ? `${session.contextUsedPercent}% ctx` : "ctx n/a",
                color: session.contextUsedPercent !== null && session.contextUsedPercent > 80
                  ? "var(--error)"
                  : "var(--text-muted)",
              },
              {
                icon: Clock,
                label: formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true }),
                color: "var(--text-muted)",
              },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Icon style={{ width: "12px", height: "12px", color }} />
                <span style={{ fontSize: "0.75rem", color }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Message stats strip */}
        {messages.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "1rem",
              padding: "0.5rem 1.25rem",
              borderBottom: "1px solid var(--border)",
              backgroundColor: "var(--card-elevated)",
              flexShrink: 0,
            }}
          >
            {[
              { label: `${userCount} user`, color: "var(--accent)" },
              { label: `${assistantCount} assistant`, color: "#60a5fa" },
              { label: `${toolCount} tool calls`, color: "#4ade80" },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: "0.72rem", color }}>
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem 1.25rem",
          }}
        >
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem",
                color: "var(--text-muted)",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid var(--accent)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Loading transcript...
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(239,68,68,0.1)",
                color: "var(--error)",
                fontSize: "0.875rem",
              }}
            >
              <AlertTriangle style={{ width: "16px", height: "16px" }} />
              {error}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              <MessageSquare
                style={{ width: "40px", height: "40px", margin: "0 auto 0.75rem", opacity: 0.3 }}
              />
              <p>No messages in this session</p>
            </div>
          )}

          {!loading &&
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onClick,
}: {
  session: Session;
  onClick: () => void;
}) {
  const color = typeColor(session.type);
  const contextBar =
    session.contextUsedPercent !== null ? Math.min(session.contextUsedPercent, 100) : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        cursor: "pointer",
        borderBottom: "1px solid var(--border)",
        transition: "background-color 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--card-elevated)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Type badge */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          flexShrink: 0,
        }}
      >
        {session.typeEmoji}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.15rem" }}>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "0.1rem 0.4rem",
              borderRadius: "9999px",
              backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
              color,
              flexShrink: 0,
            }}
          >
            {session.typeLabel}
          </span>
          {session.aborted && (
            <span style={{ fontSize: "0.65rem", color: "var(--error)" }}>⚠ aborted</span>
          )}
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={session.key}
        >
          {session.key.replace("agent:main:", "")}
        </div>
      </div>

      {/* Model */}
      <div style={{ display: "none", flexDirection: "column", alignItems: "flex-end", minWidth: "80px" }} className="sm-flex">
        <span style={{ fontSize: "0.7rem", color: "#a78bfa", whiteSpace: "nowrap" }}>
          {shortModel(session.model)}
        </span>
      </div>

      {/* Tokens + ctx bar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: "100px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
          {formatTokens(session.totalTokens)}
        </span>
        {contextBar !== null && (
          <div
            style={{
              width: "64px",
              height: "3px",
              borderRadius: "2px",
              backgroundColor: "var(--border)",
              marginTop: "0.25rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${contextBar}%`,
                height: "100%",
                borderRadius: "2px",
                backgroundColor:
                  contextBar > 80
                    ? "var(--error)"
                    : contextBar > 60
                    ? "var(--warning)"
                    : "var(--success)",
              }}
            />
          </div>
        )}
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
          {contextBar !== null ? `${contextBar}% ctx` : ""}
        </span>
      </div>

      {/* Age */}
      <div style={{ minWidth: "80px", textAlign: "right" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
        </span>
      </div>

      <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterType = "all" | "main" | "cron" | "subagent" | "direct";

const FILTER_TABS: Array<{ id: FilterType; label: string; emoji: string }> = [
  { id: "all", label: "All", emoji: "📋" },
  { id: "main", label: "Main", emoji: "🫙" },
  { id: "cron", label: "Cron", emoji: "🕐" },
  { id: "subagent", label: "Sub-agents", emoji: "🤖" },
  { id: "direct", label: "Chats", emoji: "💬" },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filtered = sessions.filter((s) => {
    if (filter !== "all" && s.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.key.toLowerCase().includes(q) && !s.model.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Counts per type
  const counts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {});

  // Stats
  const totalTokens = sessions.reduce((sum, s) => sum + s.totalTokens, 0);
  const uniqueModels = [...new Set(sessions.map((s) => s.model))];

  return (
    <>
      <div style={{ padding: "1.5rem 2rem", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-1px",
              marginBottom: "0.25rem",
            }}
          >
            💬 Session History
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            All OpenClaw agent sessions — main, cron, sub-agents, and chats
          </p>
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            {
              label: "Total Sessions",
              value: sessions.length,
              icon: MessageSquare,
              color: "var(--accent)",
            },
            {
              label: "Total Tokens",
              value: formatTokens(totalTokens),
              icon: Hash,
              color: "#60a5fa",
            },
            {
              label: "Cron Runs",
              value: counts.cron || 0,
              icon: Clock,
              color: "#a78bfa",
            },
            {
              label: "Models Used",
              value: uniqueModels.length,
              icon: Bot,
              color: "#4ade80",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.5rem",
                  backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon style={{ width: "18px", height: "18px", color }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div
          style={{
            borderRadius: "0.75rem",
            overflow: "hidden",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Tab bar + search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderBottom: "1px solid var(--border)",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {FILTER_TABS.map((tab) => {
                const count = counts[tab.id] || 0;
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? "var(--accent)" : "var(--card-elevated)",
                      color: isActive ? "var(--bg, #000)" : "var(--text-secondary)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span
                        style={{
                          backgroundColor: isActive ? "rgba(0,0,0,0.2)" : "var(--border)",
                          borderRadius: "9999px",
                          padding: "0 0.4rem",
                          fontSize: "0.7rem",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search + Refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--card-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <Search style={{ width: "13px", height: "13px", color: "var(--text-muted)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter sessions..."
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                    width: "160px",
                  }}
                />
              </div>
              <button
                onClick={() => { setLoading(true); loadSessions(); }}
                style={{
                  padding: "0.375rem",
                  borderRadius: "0.5rem",
                  background: "var(--card-elevated)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Refresh"
              >
                <RefreshCw style={{ width: "14px", height: "14px" }} />
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.5rem 1rem",
              borderBottom: "1px solid var(--border)",
              backgroundColor: "var(--card-elevated)",
            }}
          >
            <div style={{ width: "32px", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Session
            </div>
            <div style={{ minWidth: "100px", textAlign: "right", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tokens / ctx
            </div>
            <div style={{ minWidth: "80px", textAlign: "right", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Updated
            </div>
            <div style={{ width: "14px", flexShrink: 0 }} />
          </div>

          {/* Loading */}
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem",
                gap: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid var(--accent)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Loading sessions...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1.5rem",
                color: "var(--error)",
              }}
            >
              <AlertTriangle style={{ width: "16px", height: "16px" }} />
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              <MessageSquare
                style={{ width: "40px", height: "40px", margin: "0 auto 0.75rem", opacity: 0.3 }}
              />
              <p>No sessions match your filter</p>
            </div>
          )}

          {/* Session list */}
          {!loading &&
            !error &&
            filtered.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onClick={() => setSelectedSession(session)}
              />
            ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

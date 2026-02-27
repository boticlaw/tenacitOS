"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  RefreshCw,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
} from "lucide-react";

interface OutboxMessage {
  id: string;
  timestamp: string;
  channel: string;
  type: string;
  recipient: string;
  subject?: string;
  content: string;
  contentPreview: string;
  status: string;
  error?: string;
  metadata?: {
    messageId?: string;
    responseTime?: number;
    retryCount?: number;
  };
}

interface OutboxResponse {
  messages: OutboxMessage[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const channelIcons: Record<string, typeof MessageSquare> = {
  telegram: MessageSquare,
  discord: MessageSquare,
  email: Send,
  webhook: Send,
  sms: Send,
};

const channelColors: Record<string, string> = {
  telegram: "#0088cc",
  discord: "#5865F2",
  email: "#EA4335",
  webhook: "#6B7280",
  sms: "#25D366",
};

const statusColors: Record<string, string> = {
  sent: "#3B82F6",
  delivered: "#10B981",
  failed: "#EF4444",
  pending: "#F59E0B",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  sent: CheckCircle,
  delivered: CheckCircle,
  failed: XCircle,
  pending: Clock,
};

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: color || "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const Icon = statusIcons[status] || Clock;
  const color = statusColors[status] || "var(--text-muted)";

  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function MessageDetailModal({
  message,
  onClose,
}: {
  message: OutboxMessage;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4 border-b sticky top-0 z-10"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            Message Details
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70">
            <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: "var(--text-muted)" }}>Channel:</span>
            <span
              className="ml-2 capitalize px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${channelColors[message.channel] || "#6B7280"}20`,
                color: channelColors[message.channel] || "#6B7280",
              }}
            >
              {message.channel}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Status:</span>
            <span className="ml-2">
              <StatusBadge status={message.status} />
            </span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Sent:</span>
            <span className="ml-2" style={{ color: "var(--text-primary)" }}>
              {formatDateTime(message.timestamp)}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>To:</span>
            <span className="ml-2 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
              {message.recipient}
            </span>
          </div>
          {message.subject && (
            <div className="col-span-2">
              <span style={{ color: "var(--text-muted)" }}>Subject:</span>
              <span className="ml-2" style={{ color: "var(--text-primary)" }}>
                {message.subject}
              </span>
            </div>
          )}
          {message.metadata?.messageId && (
            <div className="col-span-2">
              <span style={{ color: "var(--text-muted)" }}>Message ID:</span>
              <span className="ml-2 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                {message.metadata.messageId}
              </span>
            </div>
          )}
          {message.metadata?.responseTime && (
            <div>
              <span style={{ color: "var(--text-muted)" }}>Response Time:</span>
              <span className="ml-2" style={{ color: "var(--text-primary)" }}>
                {message.metadata.responseTime}ms
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Content
            </span>
            <button
              onClick={handleCopy}
              className="text-sm flex items-center gap-1 px-2 py-1 rounded hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre
            className="p-3 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64"
            style={{ backgroundColor: "var(--card-elevated)", color: "var(--text-primary)" }}
          >
            {message.content}
          </pre>
        </div>

        {message.status === "failed" && message.error && (
          <div
            className="p-4 border-t"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <span className="text-sm font-medium text-red-500">Error:</span>
            <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>
              {message.error}
            </p>
            {message.metadata?.retryCount && (
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Retry attempts: {message.metadata.retryCount}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsLogPage() {
  const [messages, setMessages] = useState<OutboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<OutboxMessage | null>(null);

  const [filters, setFilters] = useState({
    channel: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const limit = 20;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.channel) params.set("channel", filters.channel);
      if (filters.status) params.set("status", filters.status);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const res = await fetch(`/api/notifications/outbox?${params}`);
      const data: OutboxResponse = await res.json();
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    setOffset(0);
  }, [filters]);

  const stats = {
    total,
    telegram: messages.filter((m) => m.channel === "telegram").length,
    failed: messages.filter((m) => m.status === "failed").length,
    thisWeek: messages.filter((m) => {
      const msgDate = new Date(m.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return msgDate >= weekAgo;
    }).length,
  };

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
          >
            <Bell className="w-6 h-6 md:w-8 md:h-8" style={{ color: "var(--accent)" }} />
            Notifications Log
          </h1>
          <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
            History of messages sent by OpenClaw
          </p>
        </div>
        <button
          onClick={() => fetchMessages()}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Messages" value={stats.total} />
        <StatCard label="Telegram" value={stats.telegram} color={channelColors.telegram} />
        <StatCard label="Failed" value={stats.failed} color="#EF4444" />
        <StatCard label="This Week" value={stats.thisWeek} />
      </div>

      <div
        className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <select
          value={filters.channel}
          onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="">All Channels</option>
          <option value="telegram">Telegram</option>
          <option value="discord">Discord</option>
          <option value="email">Email</option>
          <option value="webhook">Webhook</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />

        {(filters.channel || filters.status || filters.startDate || filters.endDate) && (
          <button
            onClick={() => setFilters({ channel: "", status: "", startDate: "", endDate: "" })}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl"
              style={{ backgroundColor: "var(--card)" }}
            />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>No messages found</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Messages sent by OpenClaw will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const ChannelIcon = channelIcons[msg.channel] || MessageSquare;
            const channelColor = channelColors[msg.channel] || "#6B7280";

            return (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className="flex items-start gap-3 p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${channelColor}20` }}
                >
                  <ChannelIcon className="w-4 h-4" style={{ color: channelColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>
                      {msg.channel}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--card-elevated)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {msg.type}
                    </span>
                    <StatusBadge status={msg.status} />
                  </div>
                  {msg.subject && (
                    <p className="font-medium text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                      {msg.subject}
                    </p>
                  )}
                  <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                    {msg.contentPreview}
                  </p>
                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    {formatRelativeTime(msg.timestamp)} · To: {msg.recipient}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > limit && (
        <div
          className="flex items-center justify-between mt-6 p-4 rounded-xl"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <button
            onClick={handlePrevPage}
            disabled={offset === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--card-elevated)",
              color: "var(--text-primary)",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Page {currentPage} of {totalPages} ({total} messages)
          </span>

          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className="flex items-center gap-1 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--card-elevated)",
              color: "var(--text-primary)",
            }}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedMessage && (
        <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />
      )}
    </div>
  );
}

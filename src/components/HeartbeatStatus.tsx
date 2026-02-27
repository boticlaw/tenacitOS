"use client";

import { useState } from "react";
import {
  Heart,
  Clock,
  Target,
  Edit3,
  Eye,
  Save,
  FileText,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface HeartbeatStatusProps {
  data: {
    enabled: boolean;
    every: string;
    target: string;
    activeHours: { start: string; end: string } | null;
    heartbeatMd: string;
    heartbeatMdPath: string;
    configured: boolean;
  };
  onSave: (content: string) => Promise<void>;
}

const TEMPLATE = `# Heartbeat

## Checks to perform every 30 minutes

- [ ] Check email for urgent messages
- [ ] Review calendar for events in next 2 hours
- [ ] Check weather for significant changes
- [ ] Review pending tasks
- [ ] If idle for 8+ hours, send brief check-in

## Notes

- Only alert if something actually needs attention
- Use \`HEARTBEAT_OK\` if everything is fine
- Be smart about prioritization
`;

export function HeartbeatStatus({ data, onSave }: HeartbeatStatusProps) {
  const [isEditing, setIsEditing] = useState(!data.configured);
  const [content, setContent] = useState(data.heartbeatMd);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(content);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const useTemplate = () => {
    setContent(TEMPLATE);
    setIsEditing(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          padding: "1.25rem",
        }}
      >
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-heading)",
          }}
        >
          <Heart
            className="w-5 h-5"
            style={{ color: data.enabled ? "var(--error)" : "var(--text-muted)" }}
          />
          Heartbeat Status
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Status
            </span>
            <p
              style={{
                color: data.enabled ? "var(--success)" : "var(--text-muted)",
                fontWeight: 600,
                marginTop: "0.25rem",
              }}
            >
              {data.enabled ? "✅ Active" : "⚪ Not configured"}
            </p>
          </div>

          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Interval
            </span>
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                marginTop: "0.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Clock className="w-4 h-4" style={{ color: "var(--info)" }} />
              Every {data.every}
            </p>
          </div>

          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Target
            </span>
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                marginTop: "0.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
              {data.target}
            </p>
          </div>

          {data.activeHours && (
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Active Hours
              </span>
              <p
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  marginTop: "0.25rem",
                }}
              >
                {data.activeHours.start} - {data.activeHours.end}
              </p>
            </div>
          )}
        </div>

        <a
          href="https://docs.openclaw.ai/gateway/heartbeat"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            marginTop: "1rem",
            color: "var(--info)",
            fontSize: "0.8rem",
            textDecoration: "none",
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Heartbeat Documentation
        </a>
      </div>

      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--card-elevated)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            <FileText className="w-4 h-4" />
            HEARTBEAT.md
          </span>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                backgroundColor: isEditing ? "var(--accent)" : "var(--card)",
                color: isEditing ? "#000" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {isEditing ? (
                <>
                  <Eye className="w-3.5 h-3.5" /> Preview
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{ padding: "1rem" }}>
          {!data.configured && !content && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "1rem",
                }}
              >
                No HEARTBEAT.md file found. Create one to enable heartbeat checks.
              </p>
              <button
                onClick={useTemplate}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--accent)",
                  color: "#000",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Use Template
              </button>
            </div>
          )}

          {(content || isEditing) && (
            <>
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={TEMPLATE}
                  style={{
                    width: "100%",
                    minHeight: "300px",
                    backgroundColor: "var(--card-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    color: "var(--text-primary)",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              ) : (
                <div
                  style={{
                    minHeight: "300px",
                    padding: "1rem",
                    backgroundColor: "var(--card-elevated)",
                    borderRadius: "0.5rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                  }}
                >
                  {content || TEMPLATE}
                </div>
              )}

              {isEditing && (
                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {saveSuccess && (
                    <span
                      style={{
                        color: "var(--success)",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Saved!
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "var(--success)",
                      color: "#000",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: isSaving ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

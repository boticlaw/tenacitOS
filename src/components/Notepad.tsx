"use client";

import { useState, useEffect, useRef } from "react";
import { StickyNote, Save, Trash2 } from "lucide-react";

const STORAGE_KEY = "superbotijo-notepad";

export function Notepad() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setText(data.text || "");
        setLastSaved(data.ts ? new Date(data.ts) : null);
      }
    } catch {}
  }, []);

  // Auto-save after 2 seconds of no typing
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaved(false);
    saveTimerRef.current = setTimeout(() => {
      save();
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [text]);

  const save = () => {
    const now = new Date();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, ts: now.toISOString() }));
    setSaved(true);
    setLastSaved(now);
  };

  const clear = () => {
    setText("");
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
    setLastSaved(null);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      backgroundColor: "var(--card)",
      borderRadius: "0.75rem",
      border: "1px solid var(--border)",
      overflow: "hidden",
      height: "100%",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.625rem 0.875rem",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <StickyNote className="w-3.5 h-3.5" style={{ color: "#fbbf24", flexShrink: 0 }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", flex: 1, fontWeight: 500 }}>
          Notepad
        </span>
        {!saved && (
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>saving...</span>
        )}
        {saved && lastSaved && (
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
            saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <button
          onClick={clear}
          title="Clear"
          style={{ padding: "0.2rem", borderRadius: "0.25rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Quick notes, reminders, ideas..."
        style={{
          flex: 1,
          resize: "none",
          border: "none",
          outline: "none",
          padding: "0.75rem",
          backgroundColor: "transparent",
          color: "var(--text-primary)",
          fontSize: "0.8rem",
          lineHeight: 1.6,
          fontFamily: "var(--font-body, sans-serif)",
          minHeight: "120px",
        }}
      />
    </div>
  );
}

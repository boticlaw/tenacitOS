"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, Trash2 } from "lucide-react";

const STORAGE_KEY = "superbotijo-notepad";

function loadInitialState(): { text: string; lastSaved: Date | null } {
  if (typeof window === "undefined") {
    return { text: "", lastSaved: null };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        text: data.text || "",
        lastSaved: data.ts ? new Date(data.ts) : null,
      };
    }
  } catch {}
  return { text: "", lastSaved: null };
}

export function Notepad() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialized, setInitialized] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(() => {
    const now = new Date();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, ts: now.toISOString() }));
    setSaved(true);
    setLastSaved(now);
  }, [text]);

  const clear = useCallback(() => {
    setText("");
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
    setLastSaved(null);
  }, []);

  useEffect(() => {
    if (initialized) return;
    
    const timeoutId = setTimeout(() => {
      setInitialized(true);
      const initialState = loadInitialState();
      if (initialState.text) {
        setText(initialState.text);
        setLastSaved(initialState.lastSaved);
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setTimeout(() => setSaved(false), 0);
    saveTimerRef.current = setTimeout(() => {
      save();
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [text, save, initialized]);

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

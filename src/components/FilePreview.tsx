"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface FilePreviewProps {
  workspace: string;
  path: string;
  name: string;
  onClose: () => void;
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function getLanguage(ext: string): string {
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    py: "python",
    md: "markdown",
    css: "css",
    html: "html",
    yaml: "yaml",
    yml: "yaml",
    sh: "bash",
    bash: "bash",
    sql: "sql",
  };
  return languageMap[ext] || "plaintext";
}

function isImageFile(ext: string): boolean {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"].includes(ext);
}

function isMarkdown(ext: string): boolean {
  return ext === "md" || ext === "mdx";
}

function isCodeFile(ext: string): boolean {
  return [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "py",
    "css",
    "html",
    "yaml",
    "yml",
    "sh",
    "bash",
    "sql",
    "xml",
    "toml",
  ].includes(ext);
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return (
    text
      // Headers
      .replace(
        /^### (.*$)/gm,
        '<h3 style="font-size: 1.125rem; font-weight: bold; color: var(--text-primary); margin-top: 1rem; margin-bottom: 0.5rem;">$1</h3>'
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 style="font-size: 1.25rem; font-weight: bold; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h2>'
      )
      .replace(
        /^# (.*$)/gm,
        '<h1 style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">$1</h1>'
      )
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong style="color: var(--text-primary);">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Code blocks
      .replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre style="background-color: var(--background); padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; overflow-x: auto;"><code style="color: var(--accent);">$2</code></pre>'
      )
      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code style="background-color: var(--background); padding: 0.125rem 0.375rem; border-radius: 0.25rem; color: var(--accent);">$1</code>'
      )
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" style="color: #60A5FA;" target="_blank">$1</a>'
      )
      // Unordered lists
      .replace(
        /^\s*[-*] (.*$)/gm,
        '<li style="margin-left: 1rem; list-style-type: disc;">$1</li>'
      )
      // Blockquotes
      .replace(
        /^> (.*$)/gm,
        '<blockquote style="border-left: 4px solid var(--border); padding-left: 1rem; font-style: italic; color: var(--text-secondary);">$1</blockquote>'
      )
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem;">')
      .replace(/\n/g, "<br/>")
  );
}

export function FilePreview({ workspace, path, name, onClose }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const ext = getFileExtension(name);
  const isImage = isImageFile(ext);
  const isMd = isMarkdown(ext);
  const isCode = isCodeFile(ext);
  const [loading, setLoading] = useState(!isImage);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isImage) {
      return;
    }

    fetch(`/api/browse?workspace=${encodeURIComponent(workspace)}&path=${encodeURIComponent(path)}&content=true`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file");
        return res.json();
      })
      .then((data) => {
        setContent(data.content);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [workspace, path, isImage]);

  const handleDownload = () => {
    const blob = new Blob([content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <div
        className="rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <FileText
              className="w-5 h-5"
              style={{ color: "var(--text-secondary)" }}
            />
            <span
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {name}
            </span>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: "var(--background)",
                color: "var(--text-muted)",
              }}
            >
              {ext.toUpperCase() || "FILE"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {content && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  title="Copy content"
                >
                  {copied ? (
                    <Check
                      className="w-5 h-5"
                      style={{ color: "var(--accent)" }}
                    />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  title="Download file"
                >
                  <Download className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "var(--accent)" }}
              />
            </div>
          )}

          {error && (
            <div
              className="flex flex-col items-center justify-center h-full"
              style={{ color: "var(--accent)" }}
            >
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && isImage && (
            <div className="flex items-center justify-center h-full">
              <img
                src={`/api/browse?workspace=${encodeURIComponent(workspace)}&path=${encodeURIComponent(path)}&raw=true`}
                alt={name}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={() => setError("Failed to load image")}
              />
            </div>
          )}

          {!loading && !error && isMd && content && (
            <div
              className="prose prose-invert max-w-none"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{
                __html: `<p style="margin-bottom: 1rem;">${renderMarkdown(content)}</p>`,
              }}
            />
          )}

          {!loading && !error && isCode && content && (
            <pre
              className="p-4 rounded-lg overflow-x-auto"
              style={{ backgroundColor: "var(--background)" }}
            >
              <code
                className={`language-${getLanguage(ext)} text-sm`}
                style={{ color: "var(--text-secondary)" }}
              >
                {content}
              </code>
            </pre>
          )}

          {!loading && !error && !isImage && !isMd && !isCode && content && (
            <pre
              className="p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap"
              style={{
                backgroundColor: "var(--background)",
                color: "var(--text-secondary)",
              }}
            >
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

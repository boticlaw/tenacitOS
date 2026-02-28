"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, RefreshCw, AlertCircle, Loader2, Filter, X } from "lucide-react";
import { FileTree3D } from "@/components/files-3d/FileTree3D";
import type { FileNode3D } from "@/app/api/files/tree-3d/route";

const FILE_TYPES = [
  { ext: "ts", label: "TypeScript", color: "#3178c6" },
  { ext: "tsx", label: "TSX", color: "#3178c6" },
  { ext: "js", label: "JavaScript", color: "#f7df1e" },
  { ext: "jsx", label: "JSX", color: "#61dafb" },
  { ext: "json", label: "JSON", color: "#292929" },
  { ext: "md", label: "Markdown", color: "#083fa1" },
  { ext: "css", label: "CSS", color: "#264de4" },
  { ext: "py", label: "Python", color: "#3572A5" },
  { ext: "go", label: "Go", color: "#00ADD8" },
];

export default function Files3DPage() {
  const [tree, setTree] = useState<FileNode3D[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FileNode3D | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [workspace, setWorkspace] = useState("workspace");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/tree-3d?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to load tree");
      const data = await res.json();
      setTree(data.tree || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNodeClick = useCallback((node: FileNode3D) => {
    setSelectedNode(node);
  }, []);

  const toggleType = (ext: string) => {
    setSelectedTypes((prev) =>
      prev.includes(ext) ? prev.filter((t) => t !== ext) : [...prev, ext]
    );
  };

  const filter = selectedTypes.length > 0 ? { types: selectedTypes } : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "24px 24px 16px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-1px",
                color: "var(--text-primary)",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Box style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              3D File Explorer
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
              Visualización 3D del árbol de archivos del workspace
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            >
              <option value="workspace">Workspace</option>
              <option value="openclaw">OpenClaw</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: showFilters ? "var(--accent-soft)" : "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: showFilters ? "var(--accent)" : "var(--text-primary)",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              <Filter size={14} />
              Filters
            </button>
            <button
              onClick={fetchData}
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                cursor: isLoading ? "wait" : "pointer",
                fontSize: "12px",
              }}
            >
              <RefreshCw size={14} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, borderTop: "1px solid var(--border)", position: "relative" }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Loader2 size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
              <p>Building 3D tree...</p>
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--error)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <AlertCircle size={32} style={{ marginBottom: "12px" }} />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <FileTree3D tree={tree} onNodeClick={handleNodeClick} filter={filter} />
        )}

        {showFilters && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
              File Types
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "200px" }}>
              {FILE_TYPES.map((type) => (
                <button
                  key={type.ext}
                  onClick={() => toggleType(type.ext)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    backgroundColor: selectedTypes.includes(type.ext) ? type.color : "transparent",
                    border: `1px solid ${type.color}`,
                    borderRadius: "4px",
                    color: selectedTypes.includes(type.ext) ? "#fff" : type.color,
                    cursor: "pointer",
                    fontSize: "10px",
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                style={{
                  marginTop: "8px",
                  padding: "4px 8px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "10px",
                  width: "100%",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {selectedNode && (
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "280px",
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "4px",
                    backgroundColor: selectedNode.color,
                  }}
                />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {selectedNode.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Type</div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    {selectedNode.type === "directory" ? "Directory" : selectedNode.extension.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Size</div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    {selectedNode.type === "directory"
                      ? `${selectedNode.children?.length || 0} items`
                      : `${(selectedNode.size / 1024).toFixed(1)} KB`}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Path</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedNode.path}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Last Modified</div>
                <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                  {new Date(selectedNode.lastModified).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

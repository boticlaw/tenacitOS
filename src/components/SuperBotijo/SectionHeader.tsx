/**
 * SectionHeader Component
 * Based on Component/SectionHeader from tenacios-design.json
 */

interface SectionHeaderProps {
  label: string;
}

export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Accent Line */}
      <div
        style={{
          width: "24px",
          height: "2px",
          backgroundColor: "var(--accent)",
          borderRadius: "1px",
        }}
      />

      {/* Section Label */}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "2px",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

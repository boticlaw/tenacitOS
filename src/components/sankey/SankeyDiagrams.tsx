"use client";

import { useMemo } from "react";
import {
  Sankey,
  ResponsiveContainer,
  Tooltip,
  Rectangle,
  Layer,
} from "recharts";

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyDiagramProps {
  data: SankeyData;
  title: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: SankeyNode;
  colors: string[];
}

function CustomNode({ x, y, width, height, index, payload, colors }: CustomNodeProps) {
  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={colors[index % colors.length]}
        fillOpacity={0.8}
        stroke={colors[index % colors.length]}
        strokeWidth={2}
        rx={4}
        ry={4}
      />
      <text
        x={x + width + 8}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fill="var(--text-primary)"
        fontSize={11}
        fontWeight={500}
      >
        {payload.name}
      </text>
    </Layer>
  );
}

interface CustomLinkProps {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  index: number;
  colors: string[];
}

function CustomLink({
  sourceX,
  targetX,
  sourceY,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  index,
  colors,
}: CustomLinkProps) {
  const gradientId = `link-gradient-${index}`;

  return (
    <Layer key={`link-${index}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity={0.5} />
          <stop offset="100%" stopColor={colors[(index + 1) % colors.length]} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${sourceX},${sourceY + linkWidth / 2}
          C${sourceControlX},${sourceY + linkWidth / 2}
            ${targetControlX},${targetY + linkWidth / 2}
            ${targetX},${targetY + linkWidth / 2}
          L${targetX},${targetY - linkWidth / 2}
          C${targetControlX},${targetY - linkWidth / 2}
            ${sourceControlX},${sourceY - linkWidth / 2}
            ${sourceX},${sourceY - linkWidth / 2}
          Z
        `}
        fill={`url(#${gradientId})`}
        strokeWidth={0}
        style={{ cursor: "pointer" }}
      />
    </Layer>
  );
}

export function SankeyDiagram({ data, title, colors = DEFAULT_COLORS }: SankeyDiagramProps) {
  const nodeCount = data.nodes.length;

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "16px",
        }}
      >
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          nodePadding={20}
          nodeWidth={12}
          linkCurvature={0.5}
          margin={{ top: 20, right: 120, bottom: 20, left: 20 }}
        >
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
            }}
            formatter={(value: number) => [value.toLocaleString(), "Value"]}
          />
          {data.links.map((_, index) => (
            <CustomLink
              key={index}
              sourceX={0}
              targetX={0}
              sourceY={0}
              targetY={0}
              sourceControlX={0}
              targetControlX={0}
              linkWidth={0}
              index={index}
              colors={colors}
            />
          ))}
          {data.nodes.map((node, index) => (
            <CustomNode
              key={index}
              x={0}
              y={0}
              width={0}
              height={0}
              index={index}
              payload={node}
              colors={colors}
            />
          ))}
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}

export function TokenFlowSankey({ data }: { data: SankeyData }) {
  return <SankeyDiagram data={data} title="Token Flow" colors={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]} />;
}

export function TaskFlowSankey({ data }: { data: SankeyData }) {
  return <SankeyDiagram data={data} title="Task Flow" colors={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#22c55e", "#ef4444", "#f97316"]} />;
}

export function TimeFlowSankey({ data }: { data: SankeyData }) {
  return <SankeyDiagram data={data} title="Time Flow" colors={["#f59e0b", "#3b82f6", "#8b5cf6", "#1e3a5f", "#06b6d4", "#10b981", "#f97316", "#ef4444", "#22c55e", "#ef4444", "#f59e0b"]} />;
}

/**
 * Office 3D — Agent Configuration
 *
 * This file defines the visual layout of agents in the 3D office.
 * Names, emojis and roles are loaded at runtime from the OpenClaw API
 * (/api/agents → openclaw.json), so you only need to set positions and colors here.
 *
 * Agent IDs correspond to workspace directory suffixes:
 *   id: "main"     → workspace/          (main agent)
 *   id: "studio"   → workspace-studio/
 *   id: "infra"    → workspace-infra/
 *   etc.
 *
 * Add, remove or reposition agents to match your own OpenClaw setup.
 */

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  position: [number, number, number]; // x, y, z
  color: string;
  role: string;
}

export const AGENTS: AgentConfig[] = [
  {
    id: "main",
    name: process.env.NEXT_PUBLIC_AGENT_NAME || "Mission Control",
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🦞",
    position: [0, 0, 0], // Center — main desk
    color: "#FFCC00",
    role: "Main Agent",
  },
  {
    id: "agent-2",
    name: "Agent 2",
    emoji: "🤖",
    position: [-4, 0, -3],
    color: "#4CAF50",
    role: "Sub-agent",
  },
  {
    id: "agent-3",
    name: "Agent 3",
    emoji: "🤖",
    position: [4, 0, -3],
    color: "#E91E63",
    role: "Sub-agent",
  },
  {
    id: "agent-4",
    name: "Agent 4",
    emoji: "🤖",
    position: [-4, 0, 3],
    color: "#0077B5",
    role: "Sub-agent",
  },
  {
    id: "agent-5",
    name: "Agent 5",
    emoji: "🤖",
    position: [4, 0, 3],
    color: "#9C27B0",
    role: "Sub-agent",
  },
  {
    id: "agent-6",
    name: "Agent 6",
    emoji: "🤖",
    position: [0, 0, 6],
    color: "#607D8B",
    role: "Sub-agent",
  },
];

export type AgentStatus = "idle" | "working" | "thinking" | "error" | "online" | "offline";

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  model?: string; // opus, sonnet, haiku
  tokensPerHour?: number;
  tasksInQueue?: number;
  uptime?: number; // days
  lastActivity?: string; // ISO timestamp
}

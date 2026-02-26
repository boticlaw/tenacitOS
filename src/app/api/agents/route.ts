import { NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

interface Agent {
  id: string;
  name?: string;
  emoji: string;
  color: string;
  model: string;
  workspace: string;
  dmPolicy?: string;
  allowAgents?: string[];
  allowAgentsDetails?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  botToken?: string;
  status: "online" | "offline";
  lastActivity?: string;
  activeSessions: number;
}

interface AgentConfig {
  id: string;
  name?: string;
  workspace?: string;
  model?: { primary?: string };
  subagents?: { allowAgents?: string[] };
  ui?: { emoji?: string; color?: string };
}

const DEFAULT_AGENT_CONFIG: Record<string, { emoji: string; color: string; name?: string }> = {
  main: {
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🤖",
    color: "#ff6b35",
    name: process.env.NEXT_PUBLIC_AGENT_NAME || "SuperBotijo",
  },
};

function getAgentDisplayInfo(agentId: string, agentConfig: AgentConfig | null): { emoji: string; color: string; name: string } {
  const configEmoji = agentConfig?.ui?.emoji;
  const configColor = agentConfig?.ui?.color;
  const configName = agentConfig?.name;

  const defaults = DEFAULT_AGENT_CONFIG[agentId];

  return {
    emoji: configEmoji || defaults?.emoji || "🤖",
    color: configColor || defaults?.color || "#666666",
    name: configName || defaults?.name || agentId,
  };
}

function getLatestMtimeIsoFromDir(dirPath: string, fileFilter: (name: string) => boolean): string | undefined {
  if (!existsSync(dirPath)) return undefined;

  let latest = 0;
  const files = readdirSync(dirPath);
  for (const name of files) {
    if (!fileFilter(name)) continue;
    try {
      const fullPath = join(dirPath, name);
      const stat = statSync(fullPath);
      const mtimeMs = stat.mtime.getTime();
      if (mtimeMs > latest) latest = mtimeMs;
    } catch {
      // ignore transient file errors
    }
  }

  return latest > 0 ? new Date(latest).toISOString() : undefined;
}

function resolveAgentWorkspace(agent: AgentConfig, openclawDir: string): string {
  if (typeof agent?.workspace === "string" && agent.workspace.length > 0) {
    return agent.workspace;
  }

  if (agent?.id === "main" || agent?.id === "pepon") {
    return join(openclawDir, "workspace");
  }

  const candidate = join(openclawDir, `workspace-${agent?.id || ""}`);
  if (existsSync(candidate)) return candidate;

  return join(openclawDir, "workspace");
}

function getAgentLastActivity(agentId: string, workspace?: string, openclawDir?: string): string | undefined {
  // 1) Prefer sessions activity (actual chat traffic, near real-time)
  const sessionsDir = join(openclawDir || "/root/.openclaw", "agents", agentId, "sessions");
  const latestSessionActivity = getLatestMtimeIsoFromDir(
    sessionsDir,
    (name) => name.endsWith(".jsonl") || name.endsWith(".jsonl.lock") || name === "sessions.json"
  );
  if (latestSessionActivity) return latestSessionActivity;

  // 2) Fallback to memory activity (if sessions data is unavailable)
  if (!workspace) return undefined;
  const memoryDir = join(workspace, "memory");
  return getLatestMtimeIsoFromDir(memoryDir, (name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name));
}

export async function GET() {
  try {
    const openclawDir = process.env.OPENCLAW_DIR || "/root/.openclaw";
    const configPath = openclawDir + "/openclaw.json";
    const config = JSON.parse(readFileSync(configPath, "utf-8"));

    const agents: Agent[] = config.agents.list.map((agent: AgentConfig) => {
      const agentInfo = getAgentDisplayInfo(agent.id, agent);

      const telegramAccount = config.channels?.telegram?.accounts?.[agent.id];
      const botToken = telegramAccount?.botToken;

      const workspace = resolveAgentWorkspace(agent, openclawDir);
      const lastActivity = getAgentLastActivity(agent.id, workspace, openclawDir);
      const status: "online" | "offline" =
        lastActivity && Date.now() - new Date(lastActivity).getTime() < 5 * 60 * 1000
          ? "online"
          : "offline";

      const allowAgents = agent.subagents?.allowAgents || [];
      const allowAgentsDetails = allowAgents.map((subagentId: string) => {
        const subagentConfig = config.agents.list.find((a: AgentConfig) => a.id === subagentId);
        if (subagentConfig) {
          const subagentInfo = getAgentDisplayInfo(subagentId, subagentConfig);
          return {
            id: subagentId,
            name: subagentConfig.name || subagentInfo.name,
            emoji: subagentInfo.emoji,
            color: subagentInfo.color,
          };
        }
        const fallbackInfo = getAgentDisplayInfo(subagentId, null);
        return {
          id: subagentId,
          name: fallbackInfo.name,
          emoji: fallbackInfo.emoji,
          color: fallbackInfo.color,
        };
      });

      return {
        id: agent.id,
        name: agent.name || agentInfo.name,
        emoji: agentInfo.emoji,
        color: agentInfo.color,
        model: agent.model?.primary || config.agents.defaults.model.primary,
        workspace,
        dmPolicy: telegramAccount?.dmPolicy || config.channels?.telegram?.dmPolicy || "pairing",
        allowAgents,
        allowAgentsDetails,
        botToken: botToken ? "configured" : undefined,
        status,
        lastActivity,
        activeSessions: 0,
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error reading agents:", error);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }
}

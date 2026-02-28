/**
 * Agent Inspect API
 * GET /api/agents/[id]/inspect
 * Returns detailed information about an agent
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface AgentInspectData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'idle';
  model: string;
  uptime: number;
  totalRequests: number;
  successRate: number;
  lastActivity: string;
  memoryUsage: number;
  cpuUsage: number;
  config: Record<string, unknown>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
    duration?: number;
  }>;
  logs: Array<{
    id: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  metrics: {
    requestsPerHour: number;
    avgResponseTime: number;
    tokenUsage: {
      total: number;
      input: number;
      output: number;
    };
    errorRate: number;
    peakMemory: number;
    totalSessions: number;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // In a real implementation, this would fetch from a database or agent manager
    // For now, return mock data
    const agentData: AgentInspectData = {
      id,
      name: getAgentName(id),
      status: getAgentStatus(id),
      model: getAgentModel(id),
      uptime: Math.floor(Math.random() * 86400),
      totalRequests: Math.floor(Math.random() * 10000),
      successRate: 95 + Math.random() * 5,
      lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      memoryUsage: 100 + Math.random() * 500,
      cpuUsage: Math.random() * 50,
      config: {
        model: getAgentModel(id),
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: "You are a helpful assistant.",
        tools: ["read", "write", "exec"],
        autoSave: true,
        debugMode: false,
      },
      recentActivities: generateActivities(10),
      logs: generateLogs(20),
      metrics: {
        requestsPerHour: Math.floor(Math.random() * 100),
        avgResponseTime: Math.floor(500 + Math.random() * 2000),
        tokenUsage: {
          total: Math.floor(Math.random() * 100000),
          input: Math.floor(Math.random() * 50000),
          output: Math.floor(Math.random() * 50000),
        },
        errorRate: Math.random() * 5,
        peakMemory: 500 + Math.random() * 500,
        totalSessions: Math.floor(Math.random() * 500),
      },
    };

    return NextResponse.json(agentData);
  } catch (error) {
    console.error('[agents/inspect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent data' },
      { status: 500 }
    );
  }
}

// Helper functions for mock data
function getAgentName(id: string): string {
  const names: Record<string, string> = {
    'boti': 'Boti',
    'opencode': 'OpenCode',
    'default': 'Default Agent',
    'claude': 'Claude',
    'gpt': 'GPT Agent',
  };
  return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
}

function getAgentStatus(id: string): 'active' | 'paused' | 'error' | 'idle' {
  const statuses: Array<'active' | 'paused' | 'error' | 'idle'> = ['active', 'paused', 'idle'];
  // Most agents should be active
  if (Math.random() > 0.8) {
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
  return 'active';
}

function getAgentModel(id: string): string {
  const models: Record<string, string> = {
    'boti': 'claude-3-5-sonnet-20241022',
    'opencode': 'claude-3-5-sonnet-20241022',
    'default': 'claude-3-5-sonnet-20241022',
    'claude': 'claude-3-5-sonnet-20241022',
    'gpt': 'gpt-4-turbo',
  };
  return models[id] || 'claude-3-5-sonnet-20241022';
}

function generateActivities(count: number): Array<{
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  duration?: number;
}> {
  const types = ['message', 'tool_call', 'file_read', 'file_write', 'api_call'];
  const activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
    duration?: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    activities.push({
      id: `activity-${i}`,
      type,
      description: getActivityDescription(type),
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      status: Math.random() > 0.1 ? 'success' : 'error',
      duration: Math.floor(Math.random() * 2000),
    });
  }

  return activities;
}

function getActivityDescription(type: string): string {
  const descriptions: Record<string, string[]> = {
    message: [
      'Processed user message',
      'Generated response',
      'Analyzed conversation context',
    ],
    tool_call: [
      'Called read_file tool',
      'Executed shell command',
      'Used web_search tool',
    ],
    file_read: [
      'Read configuration file',
      'Loaded session data',
      'Parsed skill file',
    ],
    file_write: [
      'Saved session state',
      'Updated configuration',
      'Wrote log file',
    ],
    api_call: [
      'Made API request to external service',
      'Called ClawHub API',
      'Fetched model response',
    ],
  };

  const options = descriptions[type] || ['Activity performed'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateLogs(count: number): Array<{
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
}> {
  const levels: Array<'info' | 'warn' | 'error' | 'debug'> = ['info', 'info', 'info', 'warn', 'debug', 'error'];
  const messages: Record<string, string[]> = {
    info: [
      'Session started',
      'Model loaded successfully',
      'Processing request',
      'Tool execution completed',
      'Response generated',
    ],
    warn: [
      'Rate limit approaching',
      'Token usage high',
      'Slow response detected',
      'Retry attempt',
    ],
    error: [
      'API request failed',
      'Tool execution error',
      'File not found',
      'Invalid response format',
    ],
    debug: [
      'Checking eligibility',
      'Resolving dependencies',
      'Parsing response',
      'Validating input',
    ],
  };

  const logs: Array<{
    id: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: string;
  }> = [];

  for (let i = 0; i < count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const levelMessages = messages[level];

    logs.push({
      id: `log-${i}`,
      level,
      message: levelMessages[Math.floor(Math.random() * levelMessages.length)],
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
    });
  }

  return logs;
}

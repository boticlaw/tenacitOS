/**
 * Agent Operations - Business logic for agent management
 */
import type { OperationResult } from './index';
import { getActivities } from '@/lib/activities-db';

export interface AgentInfo {
  id: string;
  name: string;
  status: 'working' | 'idle' | 'error' | 'paused';
  model: string;
  currentTask?: string;
  lastActivity?: string;
  tokensUsed: number;
  sessionCount: number;
}

export interface AgentMood {
  agentId: string;
  mood: 'productive' | 'busy' | 'frustrated' | 'content' | 'tired';
  emoji: string;
  streak: number;
  energyLevel: number;
  lastCalculated: string;
}

// In-memory agent registry (would be DB in production)
const agentRegistry = new Map<string, AgentInfo>();
const agentMoods = new Map<string, AgentMood>();

// Initialize with default agent
agentRegistry.set('superbotijo', {
  id: 'superbotijo',
  name: 'SuperBotijo',
  status: 'idle',
  model: 'claude-sonnet-4-20250514',
  tokensUsed: 0,
  sessionCount: 0,
});

/**
 * Get all registered agents
 */
export async function getAgents(): Promise<OperationResult<AgentInfo[]>> {
  try {
    return {
      success: true,
      data: Array.from(agentRegistry.values()),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agents',
    };
  }
}

/**
 * Get a single agent by ID
 */
export async function getAgentById(id: string): Promise<OperationResult<AgentInfo>> {
  try {
    const agent = agentRegistry.get(id);
    
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    return { success: true, data: agent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agent',
    };
  }
}

/**
 * Update agent status
 */
export async function updateAgentStatus(
  id: string,
  status: AgentInfo['status'],
  currentTask?: string
): Promise<OperationResult<AgentInfo>> {
  try {
    const agent = agentRegistry.get(id);
    
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    agent.status = status;
    if (currentTask !== undefined) {
      agent.currentTask = currentTask;
    }
    agent.lastActivity = new Date().toISOString();

    return { success: true, data: { ...agent } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

/**
 * Pause an agent
 */
export async function pauseAgent(id: string): Promise<OperationResult> {
  try {
    const result = await updateAgentStatus(id, 'paused');
    
    if (!result.success) {
      return result;
    }

    // Log the pause
    console.log(`[agent-ops] Agent ${id} paused at ${new Date().toISOString()}`);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause agent',
    };
  }
}

/**
 * Resume a paused agent
 */
export async function resumeAgent(id: string): Promise<OperationResult> {
  try {
    const agent = agentRegistry.get(id);
    
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (agent.status !== 'paused') {
      return { success: false, error: 'Agent is not paused' };
    }

    return updateAgentStatus(id, 'idle');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume agent',
    };
  }
}

/**
 * Calculate agent mood based on recent activity
 */
export async function calculateAgentMood(id: string): Promise<OperationResult<AgentMood>> {
  try {
    const agent = agentRegistry.get(id);
    
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Get recent activities for this agent
    const result = getActivities({ limit: 100, sort: 'newest' });
    const recentActivities = result.activities.slice(0, 50);

    // Calculate metrics
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const recentHour = recentActivities.filter(
      a => new Date(a.timestamp).getTime() > hourAgo
    );

    const errorCount = recentHour.filter(a => a.status === 'error').length;
    const successCount = recentHour.filter(a => a.status === 'success').length;
    const totalTokens = recentHour.reduce((sum, a) => sum + (a.tokens_used || 0), 0);

    // Determine mood
    let mood: AgentMood['mood'];
    let emoji: string;

    if (errorCount > 3) {
      mood = 'frustrated';
      emoji = '😤';
    } else if (recentHour.length > 20) {
      mood = 'busy';
      emoji = '🔥';
    } else if (totalTokens > 50000) {
      mood = 'tired';
      emoji = '😴';
    } else if (successCount > 5 && errorCount === 0) {
      mood = 'productive';
      emoji = '🚀';
    } else {
      mood = 'content';
      emoji = '😊';
    }

    // Calculate energy level (0-100)
    const energyLevel = Math.max(0, Math.min(100, 
      100 - (errorCount * 10) - (totalTokens / 1000)
    ));

    // Calculate streak (consecutive successful days - simplified)
    const streak = successCount > 0 ? Math.min(successCount, 7) : 0;

    const agentMood: AgentMood = {
      agentId: id,
      mood,
      emoji,
      streak,
      energyLevel: Math.round(energyLevel),
      lastCalculated: new Date().toISOString(),
    };

    agentMoods.set(id, agentMood);

    return { success: true, data: agentMood };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate mood',
    };
  }
}

/**
 * Get agent mood (cached or recalculate)
 */
export async function getAgentMood(
  id: string,
  forceRefresh: boolean = false
): Promise<OperationResult<AgentMood>> {
  try {
    const cached = agentMoods.get(id);
    
    // Return cached if fresh (< 5 minutes old)
    if (!forceRefresh && cached) {
      const cacheAge = Date.now() - new Date(cached.lastCalculated).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return { success: true, data: cached };
      }
    }

    return calculateAgentMood(id);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mood',
    };
  }
}

/**
 * Register a new agent
 */
export async function registerAgent(
  id: string,
  name: string,
  model: string
): Promise<OperationResult<AgentInfo>> {
  try {
    if (agentRegistry.has(id)) {
      return { success: false, error: 'Agent already exists' };
    }

    const agent: AgentInfo = {
      id,
      name,
      model,
      status: 'idle',
      tokensUsed: 0,
      sessionCount: 0,
    };

    agentRegistry.set(id, agent);

    return { success: true, data: agent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register agent',
    };
  }
}

/**
 * Unregister an agent
 */
export async function unregisterAgent(id: string): Promise<OperationResult> {
  try {
    if (!agentRegistry.has(id)) {
      return { success: false, error: 'Agent not found' };
    }

    // Don't allow unregistering the main agent
    if (id === 'superbotijo') {
      return { success: false, error: 'Cannot unregister main agent' };
    }

    agentRegistry.delete(id);
    agentMoods.delete(id);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unregister agent',
    };
  }
}

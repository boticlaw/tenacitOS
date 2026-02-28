/**
 * Agent Config API - Get/Update config for a specific agent
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/operations/agent-ops';

// In-memory config store (would be DB in production)
const agentConfigs = new Map<string, Record<string, any>>();

// Default config
const DEFAULT_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokens: 4096,
  heartbeatInterval: 30,
  autoStart: true,
  logLevel: 'info',
  skills: [],
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params;
    
    // Verify agent exists
    const agentResult = await getAgentById(agentId);
    if (!agentResult.success) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get config
    const config = agentConfigs.get(agentId) || {
      ...DEFAULT_CONFIG,
      model: agentResult.data?.model || DEFAULT_CONFIG.model,
    };

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[api/agents/[id]/config] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get config' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();
    
    // Verify agent exists
    const agentResult = await getAgentById(agentId);
    if (!agentResult.success) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get current config
    const currentConfig = agentConfigs.get(agentId) || {
      ...DEFAULT_CONFIG,
      model: agentResult.data?.model || DEFAULT_CONFIG.model,
    };

    // Validate updates
    const updates: Record<string, any> = {};
    
    if (body.temperature !== undefined) {
      const temp = parseFloat(body.temperature);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        return NextResponse.json({ error: 'Invalid temperature (0-2)' }, { status: 400 });
      }
      updates.temperature = temp;
    }

    if (body.maxTokens !== undefined) {
      const tokens = parseInt(body.maxTokens);
      if (isNaN(tokens) || tokens < 1 || tokens > 100000) {
        return NextResponse.json({ error: 'Invalid maxTokens (1-100000)' }, { status: 400 });
      }
      updates.maxTokens = tokens;
    }

    if (body.heartbeatInterval !== undefined) {
      const interval = parseInt(body.heartbeatInterval);
      if (isNaN(interval) || interval < 5 || interval > 3600) {
        return NextResponse.json({ error: 'Invalid heartbeatInterval (5-3600 seconds)' }, { status: 400 });
      }
      updates.heartbeatInterval = interval;
    }

    if (body.model !== undefined) {
      updates.model = body.model;
    }

    if (body.autoStart !== undefined) {
      updates.autoStart = Boolean(body.autoStart);
    }

    if (body.logLevel !== undefined) {
      if (!['debug', 'info', 'warn', 'error'].includes(body.logLevel)) {
        return NextResponse.json({ error: 'Invalid logLevel' }, { status: 400 });
      }
      updates.logLevel = body.logLevel;
    }

    if (body.skills !== undefined) {
      updates.skills = Array.isArray(body.skills) ? body.skills : [];
    }

    // Merge and save
    const newConfig = { ...currentConfig, ...updates };
    agentConfigs.set(agentId, newConfig);

    return NextResponse.json({ 
      success: true, 
      config: newConfig,
      message: 'Config updated successfully',
    });
  } catch (error) {
    console.error('[api/agents/[id]/config] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update config' },
      { status: 500 }
    );
  }
}

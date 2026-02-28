/**
 * Agent Action API
 * POST /api/agents/[id]/action
 * Executes actions on an agent (pause, resume, restart)
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would communicate with the agent manager
    // For now, return success
    const validActions = ['pause', 'resume', 'restart', 'stop', 'start'];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    console.log(`[agents/action] ${action} agent ${id}`);

    return NextResponse.json({
      success: true,
      agentId: id,
      action,
      timestamp: new Date().toISOString(),
      message: `Agent ${id} ${action}ed successfully`,
    });
  } catch (error) {
    console.error('[agents/action] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}

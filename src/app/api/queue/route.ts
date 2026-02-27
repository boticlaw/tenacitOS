/**
 * Task Queue API
 * GET /api/queue - Returns pending and running tasks
 */
import { NextResponse } from 'next/server';
import { getActivities, Activity } from '@/lib/activities-db';

export interface QueuedTask {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'running';
  timestamp: string;
  agent: string | null;
  waitTimeMs: number;
  priority: number; // Higher = more urgent (based on type)
}

// Priority mapping based on task type
const TYPE_PRIORITY: Record<string, number> = {
  security: 100,
  command: 80,
  build: 70,
  task: 60,
  agent_action: 55,
  tool_call: 50,
  file_write: 40,
  file_read: 30,
  message: 20,
  web_search: 15,
  search: 15,
  cron: 10,
  cron_run: 10,
  memory: 5,
  file: 5,
};

function getPriority(type: string): number {
  return TYPE_PRIORITY[type] ?? 25;
}

export async function GET() {
  try {
    // Get pending and running activities
    const pendingResult = getActivities({ status: 'pending', limit: 50, sort: 'oldest' });
    const runningResult = getActivities({ status: 'running', limit: 50, sort: 'oldest' });

    const now = Date.now();

    const formatTask = (activity: Activity, status: 'pending' | 'running'): QueuedTask => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      status,
      timestamp: activity.timestamp,
      agent: activity.agent,
      waitTimeMs: now - new Date(activity.timestamp).getTime(),
      priority: getPriority(activity.type),
    });

    const pending: QueuedTask[] = pendingResult.activities.map((a) => formatTask(a, 'pending'));
    const running: QueuedTask[] = runningResult.activities.map((a) => formatTask(a, 'running'));

    // Calculate metrics
    const totalPending = pending.length;
    const totalRunning = running.length;
    const avgWaitTimeMs = pending.length > 0
      ? Math.round(pending.reduce((sum, t) => sum + t.waitTimeMs, 0) / pending.length)
      : 0;

    // Group by type
    const byType: Record<string, number> = {};
    for (const task of [...pending, ...running]) {
      byType[task.type] = (byType[task.type] || 0) + 1;
    }

    return NextResponse.json({
      pending,
      running,
      metrics: {
        totalPending,
        totalRunning,
        avgWaitTimeMs,
        byType,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[queue] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue', pending: [], running: [], metrics: null },
      { status: 500 }
    );
  }
}

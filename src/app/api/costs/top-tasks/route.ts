/**
 * Top Tasks by Token Consumption API
 * GET /api/costs/top-tasks?period=day|week|month
 */
import { NextRequest, NextResponse } from 'next/server';
import { getActivities } from '@/lib/activities-db';

export interface TopTask {
  type: string;
  tokens: number;
  count: number;
  avgTokens: number;
  percentOfTotal: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  previousTokens: number;
}

export const dynamic = 'force-dynamic';

function getDateRange(period: string): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (period) {
    case 'day':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd = new Date(start);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(start);
      break;
    case 'month':
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 30);
      previousEnd = new Date(start);
      break;
  }

  return { start, end, previousStart, previousEnd };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || 'month';
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  try {
    const { start, end, previousStart, previousEnd } = getDateRange(period);

    // Get activities for current period
    const currentResult = getActivities({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      limit: 1000,
      sort: 'newest',
    });

    // Get activities for previous period (for trend calculation)
    const previousResult = getActivities({
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
      limit: 1000,
      sort: 'newest',
    });

    // Aggregate by type for current period
    const byTypeCurrent: Record<string, { tokens: number; count: number }> = {};
    let totalTokensCurrent = 0;

    for (const activity of currentResult.activities) {
      const tokens = activity.tokens_used || 0;
      if (tokens > 0) {
        const type = activity.type || 'unknown';
        if (!byTypeCurrent[type]) {
          byTypeCurrent[type] = { tokens: 0, count: 0 };
        }
        byTypeCurrent[type].tokens += tokens;
        byTypeCurrent[type].count += 1;
        totalTokensCurrent += tokens;
      }
    }

    // Aggregate by type for previous period
    const byTypePrevious: Record<string, { tokens: number; count: number }> = {};
    let totalTokensPrevious = 0;

    for (const activity of previousResult.activities) {
      const tokens = activity.tokens_used || 0;
      if (tokens > 0) {
        const type = activity.type || 'unknown';
        if (!byTypePrevious[type]) {
          byTypePrevious[type] = { tokens: 0, count: 0 };
        }
        byTypePrevious[type].tokens += tokens;
        byTypePrevious[type].count += 1;
        totalTokensPrevious += tokens;
      }
    }

    // Build top tasks with trend
    const topTasks: TopTask[] = Object.entries(byTypeCurrent)
      .map(([type, data]) => {
        const percentOfTotal = totalTokensCurrent > 0 ? (data.tokens / totalTokensCurrent) * 100 : 0;
        const previousTokens = byTypePrevious[type]?.tokens || 0;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercent = 0;
        
        if (previousTokens > 0) {
          trendPercent = ((data.tokens - previousTokens) / previousTokens) * 100;
          if (trendPercent > 10) trend = 'up';
          else if (trendPercent < -10) trend = 'down';
        } else if (data.tokens > 0) {
          trend = 'up';
          trendPercent = 100;
        }

        return {
          type,
          tokens: data.tokens,
          count: data.count,
          avgTokens: Math.round(data.tokens / data.count),
          percentOfTotal,
          trend,
          trendPercent: Math.abs(trendPercent),
          previousTokens,
        };
      })
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, limit);

    return NextResponse.json({
      tasks: topTasks,
      period,
      totalTokens: totalTokensCurrent,
      previousTotalTokens: totalTokensPrevious,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[top-tasks] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top tasks', tasks: [], totalTokens: 0 },
      { status: 500 }
    );
  }
}

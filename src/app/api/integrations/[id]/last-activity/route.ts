/**
 * Integration Last Activity API
 * GET /api/integrations/[id]/last-activity
 * Returns last activity and usage stats for an integration
 */
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const ACTIVITIES_DB = path.join(process.cwd(), 'data', 'activities.db');

interface ActivityStats {
  lastActivity: string | null;
  lastActivityRelative: string | null;
  usage24h: number;
  usage7d: number;
  usage30d: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const integrationId = decodeURIComponent(id);

  if (!fs.existsSync(ACTIVITIES_DB)) {
    return NextResponse.json({
      lastActivity: null,
      lastActivityRelative: null,
      usage24h: 0,
      usage7d: 0,
      usage30d: 0,
    });
  }

  const db = new Database(ACTIVITIES_DB, { readonly: true });

  try {
    // Map integration ID to activity types
    const typeMap: Record<string, string[]> = {
      telegram: ['message', 'message_sent'],
      twitter: ['message', 'message_sent'],
      google: ['search', 'command'],
    };

    const types = typeMap[integrationId] || [];

    if (types.length === 0) {
      return NextResponse.json({
        lastActivity: null,
        lastActivityRelative: null,
        usage24h: 0,
        usage7d: 0,
        usage30d: 0,
      });
    }

    const typePlaceholders = types.map(() => '?').join(',');

    // Get last activity
    const lastActivityResult = db.prepare(`
      SELECT timestamp
      FROM activities
      WHERE type IN (${typePlaceholders})
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(...types) as { timestamp: string } | undefined;

    // Get usage counts
    const now = Date.now();
    const day24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const day7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const day30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    const count24h = db.prepare(`
      SELECT COUNT(*) as count
      FROM activities
      WHERE type IN (${typePlaceholders}) AND timestamp >= ?
    `).get(...types, day24h) as { count: number };

    const count7d = db.prepare(`
      SELECT COUNT(*) as count
      FROM activities
      WHERE type IN (${typePlaceholders}) AND timestamp >= ?
    `).get(...types, day7d) as { count: number };

    const count30d = db.prepare(`
      SELECT COUNT(*) as count
      FROM activities
      WHERE type IN (${typePlaceholders}) AND timestamp >= ?
    `).get(...types, day30d) as { count: number };

    // Calculate relative time
    let lastActivityRelative: string | null = null;
    if (lastActivityResult?.timestamp) {
      const lastTime = new Date(lastActivityResult.timestamp).getTime();
      const diffMs = now - lastTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        lastActivityRelative = 'Just now';
      } else if (diffMins < 60) {
        lastActivityRelative = `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        lastActivityRelative = `${diffHours} hours ago`;
      } else {
        lastActivityRelative = `${diffDays} days ago`;
      }
    }

    const stats: ActivityStats = {
      lastActivity: lastActivityResult?.timestamp || null,
      lastActivityRelative,
      usage24h: count24h.count,
      usage7d: count7d.count,
      usage30d: count30d.count,
    };

    return NextResponse.json(stats);
  } finally {
    db.close();
  }
}

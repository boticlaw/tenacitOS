/**
 * ClawHub Inspect API
 * GET /api/skills/clawhub/inspect/[slug]
 * Returns detailed information about a ClawHub skill
 */
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Skill slug required' },
        { status: 400 }
      );
    }

    // Get skill info from ClawHub
    const output = execSync(
      `clawhub inspect "${slug}" --json 2>&1`,
      {
        timeout: 10000,
        encoding: 'utf-8',
      }
    );

    // Parse JSON (skip first line if it's a message)
    const lines = output.trim().split('\n');
    let jsonStr = output;

    // If first line is not JSON, skip it
    if (lines.length > 1 && !lines[0].trim().startsWith('{')) {
      jsonStr = lines.slice(1).join('\n');
    }

    const data = JSON.parse(jsonStr);

    // Transform to include eligibility info
    const result = {
      slug,
      displayName: data.displayName || data.name || slug,
      summary: data.summary || data.description || '',
      latestVersion: data.latestVersion || data.version,
      dependencies: data.dependencies || {},
      peerDependencies: data.peerDependencies || {},
      openclaw: data.openclaw || {
        minVersion: data.minVersion,
        maxVersion: data.maxVersion,
        permissions: data.permissions || [],
        platforms: data.platforms || ['*'],
      },
      estimatedSize: data.estimatedSize || estimateSize(data),
      owner: data.owner || {},
      stats: data.stats || {},
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[clawhub/inspect] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to inspect skill', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Estimate skill size based on content
 */
function estimateSize(data: Record<string, unknown>): number {
  // Rough estimate: 50KB base + 10KB per file
  const fileCount = (data.files as string[])?.length || 5;
  return 50000 + fileCount * 10000;
}

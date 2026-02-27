/**
 * Skill Update API
 * POST /api/skills/[id]/update
 * Updates a specific skill to latest or specified version
 */
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const slug = decodeURIComponent(id);

  try {
    const body = await request.json().catch(() => ({}));
    const { version } = body;

    // Update using ClawHub CLI
    const versionArg = version ? ` --version ${version}` : '';
    const command = `clawhub update${versionArg} "${slug}" 2>&1`;

    console.log(`[skills/update] Running: ${command}`);

    const output = execSync(command, {
      timeout: 30000,
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    console.log(`[skills/update] Output:`, output);

    // Check if update was successful
    if (output.includes('Error') || output.includes('Failed')) {
      return NextResponse.json(
        { error: 'Update failed', output },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      version: version || 'latest',
      output,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[skills/update] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update skill', details: errorMessage },
      { status: 500 }
    );
  }
}

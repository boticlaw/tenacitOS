/**
 * Skills Update All API
 * POST /api/skills/update-all
 * Updates all skills that have available updates
 */
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

interface UpdateResult {
  slug: string;
  success: boolean;
  previousVersion?: string;
  newVersion?: string;
  error?: string;
}

export async function POST(request: Request) {
  try {
    // Get list of skills with updates
    const listOutput = execSync('clawhub list 2>&1', {
      timeout: 5000,
      encoding: 'utf-8',
    });

    const installedSkills: Array<{ slug: string; version: string }> = [];
    const lines = listOutput.trim().split('\n').filter(l => l);

    for (const line of lines) {
      const match = line.match(/^(\S+)\s+(\S+)$/);
      if (match) {
        installedSkills.push({
          slug: match[1],
          version: match[2],
        });
      }
    }

    const results: UpdateResult[] = [];
    const errors: string[] = [];

    for (const skill of installedSkills) {
      try {
        // Check for updates
        const inspectOutput = execSync(
          `clawhub inspect "${skill.slug}" --json 2>&1`,
          {
            timeout: 5000,
            encoding: 'utf-8',
          }
        );

        // Parse JSON (skip first line if not JSON)
        const jsonStr = inspectOutput.split('\n').slice(1).join('\n') || inspectOutput;
        const data = JSON.parse(jsonStr);

        const latestVersion = data.latestVersion?.version || skill.version;
        const hasUpdate = latestVersion !== skill.version;

        if (hasUpdate) {
          // Update the skill
          try {
            const updateOutput = execSync(
              `clawhub update --dir skills "${skill.slug}" 2>&1`,
              {
                timeout: 60000,
                encoding: 'utf-8',
                cwd: process.cwd(),
              }
            );

            results.push({
              slug: skill.slug,
              success: true,
              previousVersion: skill.version,
              newVersion: latestVersion,
            });
          } catch (updateError) {
            const errorMsg = updateError instanceof Error ? updateError.message : 'Unknown error';
            results.push({
              slug: skill.slug,
              success: false,
              previousVersion: skill.version,
              error: errorMsg,
            });
            errors.push(`${skill.slug}: ${errorMsg}`);
          }
        }
      } catch (inspectError) {
        // Skip skills we can't inspect
        console.error(`Failed to check ${skill.slug}:`, inspectError);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: errors.length === 0,
      totalChecked: installedSkills.length,
      totalUpdated: successCount,
      totalFailed: failCount,
      results,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[skills/update-all] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update skills', details: errorMessage },
      { status: 500 }
    );
  }
}

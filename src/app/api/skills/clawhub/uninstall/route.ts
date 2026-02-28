/**
 * ClawHub Uninstall API
 * POST /api/skills/clawhub/uninstall
 * Uninstalls a skill with cleanup
 */
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Skill slug required' },
        { status: 400 }
      );
    }

    // Determine skills directory
    const skillsDir = path.join(process.cwd(), 'skills');
    const skillDir = path.join(skillsDir, slug);

    // Check if skill exists
    if (!fs.existsSync(skillDir)) {
      return NextResponse.json(
        { error: 'Skill not found', slug },
        { status: 404 }
      );
    }

    // Get list of files before removal for rollback potential
    const filesBefore = listFilesRecursive(skillDir);

    // Try using ClawHub CLI first
    try {
      const command = `clawhub uninstall --dir skills "${slug}" 2>&1`;
      console.log(`[clawhub/uninstall] Running: ${command}`);

      const output = execSync(command, {
        timeout: 30000,
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      console.log(`[clawhub/uninstall] Output:`, output);

      return NextResponse.json({
        success: true,
        slug,
        removedFiles: filesBefore.length,
        output,
        timestamp: new Date().toISOString(),
      });
    } catch (cliError) {
      // CLI failed, fall back to manual removal
      console.log('[clawhub/uninstall] CLI failed, using manual removal');
    }

    // Manual removal
    fs.rmSync(skillDir, { recursive: true, force: true });

    // Also remove from .disabled if exists
    const disabledDir = path.join(skillsDir, `${slug}.disabled`);
    if (fs.existsSync(disabledDir)) {
      fs.rmSync(disabledDir, { recursive: true, force: true });
    }

    return NextResponse.json({
      success: true,
      slug,
      removedFiles: filesBefore.length,
      method: 'manual',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[clawhub/uninstall] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to uninstall skill', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Recursively list all files in a directory
 */
function listFilesRecursive(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

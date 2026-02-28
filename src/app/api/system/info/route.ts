/**
 * System Info API
 * GET /api/system/info
 * Returns system information for eligibility checks
 */
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get OpenClaw version
    let openclawVersion = '0.0.0';
    try {
      const versionOutput = execSync('openclaw --version 2>/dev/null || echo "0.0.0"', {
        encoding: 'utf-8',
        timeout: 5000,
      });
      const match = versionOutput.match(/(\d+\.\d+\.\d+)/);
      if (match) {
        openclawVersion = match[1];
      }
    } catch {
      // Version detection failed, use default
    }

    // Get platform
    const platform = os.platform();

    // Get available disk space
    let availableDiskSpace = 0;
    try {
      // Check the workspace directory for available space
      const workspaceDir = process.cwd();
      if (platform === 'linux') {
        const dfOutput = execSync(`df -B1 "${workspaceDir}" | tail -1`, {
          encoding: 'utf-8',
          timeout: 5000,
        });
        const match = dfOutput.match(/\s+(\d+)\s+\d+%\s/);
        if (match) {
          availableDiskSpace = parseInt(match[1], 10);
        }
      } else if (platform === 'darwin') {
        const dfOutput = execSync(`df -k "${workspaceDir}" | tail -1`, {
          encoding: 'utf-8',
          timeout: 5000,
        });
        const match = dfOutput.match(/\s+(\d+)\s+\d+%\s/);
        if (match) {
          availableDiskSpace = parseInt(match[1], 10) * 1024; // Convert KB to bytes
        }
      }
    } catch {
      // Disk space detection failed
    }

    // Get Node.js version
    const nodeVersion = process.version;

    // Get memory info
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return NextResponse.json({
      openclawVersion,
      platform,
      availableDiskSpace,
      nodeVersion,
      totalMemory,
      freeMemory,
      hostname: os.hostname(),
      arch: os.arch(),
      cpus: os.cpus().length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[system/info] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get system info' },
      { status: 500 }
    );
  }
}

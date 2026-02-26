/**
 * Service action API
 * POST /api/system/services
 * Body: { name, backend, action }  action: restart | stop | start | logs
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ALLOWED_DOCKER_IDS_PATTERN = /^[a-f0-9]{6,64}$|^[a-zA-Z0-9_-]+$/;

// Load additional services from environment or config file
function loadAdditionalServices(): { systemd: string[]; pm2: string[] } {
  const systemd: string[] = [];
  const pm2: string[] = [];
  
  // 1. From environment variable (comma-separated)
  // TENACITOS_SYSTEMD_SERVICES=nginx,apache
  const envSystemd = process.env.TENACITOS_SYSTEMD_SERVICES;
  if (envSystemd) {
    systemd.push(...envSystemd.split(',').map(s => s.trim()).filter(Boolean));
  }
  
  const envPm2 = process.env.TENACITOS_PM2_SERVICES;
  if (envPm2) {
    pm2.push(...envPm2.split(',').map(s => s.trim()).filter(Boolean));
  }
  
  // 2. From config file (if exists)
  // Look in mission-control directory (where package.json is)
  const fs = require('fs');
  const path = require('path');
  
  // Try multiple locations for the config file
  const configLocations = [
    path.join(process.cwd(), 'allowed-services.json'),           // Current working directory
    path.join(__dirname, '..', '..', '..', 'allowed-services.json'), // Relative to this file
    '/root/.openclaw/workspace/mission-control/allowed-services.json' // Absolute path as fallback
  ];
  
  for (const configFile of configLocations) {
    try {
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        if (config.systemd && Array.isArray(config.systemd)) {
          systemd.push(...config.systemd);
        }
        if (config.pm2 && Array.isArray(config.pm2)) {
          pm2.push(...config.pm2);
        }
        break; // Stop after first valid config found
      }
    } catch {
      // Config file invalid, try next location
    }
  }
  
  return { systemd, pm2 };
}

// Auto-detect OpenClaw-related services
function getAllowedServices(): { systemd: string[]; pm2: string[] } {
  // Get all running systemd services
  const systemdServices: string[] = [];
  
  try {
    const { stdout } = require('child_process').execSync(
      'systemctl list-units --type=service --state=running --no-pager -o json 2>/dev/null',
      { encoding: 'utf-8' }
    );
    const services = JSON.parse(stdout);
    
    // Filter OpenClaw-related services
    for (const svc of services) {
      const name = svc.unit.replace('.service', '');
      // Auto-allow if contains openclaw, superbotijo, or mission-control
      if (name.includes('openclaw') || 
          name.includes('tenacitos') || 
          name.includes('mission-control')) {
        systemdServices.push(name);
      }
    }
  } catch {
    // Fallback to known services
    systemdServices.push('openclaw-gateway', 'tenacitos');
  }
  
  // Check if PM2 is installed and has processes
  const pm2Services: string[] = [];
  try {
    require('child_process').execSync('which pm2', { encoding: 'utf-8' });
    const { stdout } = require('child_process').execSync(
      'pm2 jlist 2>/dev/null',
      { encoding: 'utf-8' }
    );
    const pm2List = JSON.parse(stdout);
    for (const proc of pm2List) {
      pm2Services.push(proc.name);
    }
  } catch {
    // PM2 not installed or no processes
  }
  
  // Load additional services from config
  const additional = loadAdditionalServices();
  
  return {
    systemd: [...new Set([...systemdServices, ...additional.systemd])],
    pm2: [...new Set([...pm2Services, ...additional.pm2])]
  };
}

async function pm2Action(name: string, action: string): Promise<string> {
  const { pm2: allowedServices } = getAllowedServices();
  
  if (!allowedServices.includes(name)) {
    throw new Error(`Service "${name}" not in allowlist. Allowed: ${allowedServices.join(', ') || 'none'}`);
  }
  if (!['restart', 'stop', 'start', 'logs'].includes(action)) {
    throw new Error(`Invalid action "${action}"`);
  }

  if (action === 'logs') {
    // Get last 100 lines of PM2 logs
    try {
      const logFile = `/root/.pm2/logs/${name}-out.log`;
      const { stdout } = await execAsync(`tail -100 "${logFile}" 2>/dev/null || echo "No logs available"`);
      const errFile = `/root/.pm2/logs/${name}-error.log`;
      const { stdout: errOut } = await execAsync(`tail -50 "${errFile}" 2>/dev/null || echo ""`).catch(() => ({ stdout: '' }));
      return `=== STDOUT (last 100 lines) ===\n${stdout}\n${errOut ? `\n=== STDERR (last 50 lines) ===\n${errOut}` : ''}`;
    } catch {
      return 'Could not retrieve logs';
    }
  }

  const { stdout, stderr } = await execAsync(`pm2 ${action} "${name}" 2>&1`);
  return stdout + (stderr ? `\nSTDERR: ${stderr}` : '');
}

async function systemdAction(name: string, action: string): Promise<string> {
  const { systemd: allowedServices } = getAllowedServices();
  
  if (!allowedServices.includes(name)) {
    throw new Error(`Service "${name}" not in allowlist. Allowed: ${allowedServices.join(', ') || 'none'}`);
  }
  if (!['restart', 'stop', 'start', 'logs'].includes(action)) {
    throw new Error(`Invalid action "${action}"`);
  }

  if (action === 'logs') {
    const { stdout } = await execAsync(`journalctl -u "${name}" -n 100 --no-pager 2>&1`);
    return stdout;
  }

  const { stdout } = await execAsync(`systemctl ${action} "${name}" 2>&1`);
  return stdout || `${action} executed successfully`;
}

async function dockerAction(id: string, action: string): Promise<string> {
  if (!ALLOWED_DOCKER_IDS_PATTERN.test(id)) {
    throw new Error(`Invalid container ID "${id}"`);
  }
  if (!['start', 'stop', 'restart', 'logs'].includes(action)) {
    throw new Error(`Invalid action "${action}"`);
  }

  if (action === 'logs') {
    const { stdout } = await execAsync(`docker logs --tail 100 "${id}" 2>&1`);
    return stdout;
  }

  const { stdout } = await execAsync(`docker ${action} "${id}" 2>&1`);
  return stdout || `${action} executed successfully`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, backend, action } = body;

    if (!name || !backend || !action) {
      return NextResponse.json({ error: 'Missing name, backend or action' }, { status: 400 });
    }

    let output = '';

    switch (backend) {
      case 'pm2':
        output = await pm2Action(name, action);
        break;
      case 'systemd':
        output = await systemdAction(name, action);
        break;
      case 'docker':
        output = await dockerAction(name, action);
        break;
      default:
        return NextResponse.json({ error: `Unknown backend "${backend}"` }, { status: 400 });
    }

    return NextResponse.json({ success: true, output, action, name, backend });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[services API] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

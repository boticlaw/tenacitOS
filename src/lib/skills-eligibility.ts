/**
 * Skills Eligibility Checks
 * Verifies requirements before skill installation
 */

export interface EligibilityRequirement {
  type: 'dependency' | 'version' | 'permission' | 'platform' | 'disk';
  name: string;
  required: string;
  current?: string;
  satisfied: boolean;
  message: string;
  critical: boolean; // If true, blocks installation
}

export interface EligibilityResult {
  eligible: boolean;
  requirements: EligibilityRequirement[];
  warnings: string[];
  blockers: string[];
}

export interface SkillManifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  openclaw?: {
    minVersion?: string;
    maxVersion?: string;
    permissions?: string[];
    platforms?: string[];
  };
  estimatedSize?: number; // in bytes
}

/**
 * Check if a skill can be installed on this system
 */
export async function checkEligibility(
  manifest: SkillManifest,
  systemInfo?: {
    openclawVersion?: string;
    platform?: string;
    availableDiskSpace?: number;
  }
): Promise<EligibilityResult> {
  const requirements: EligibilityRequirement[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];

  // Get system info if not provided
  const info = systemInfo || (await getSystemInfo());

  // Check OpenClaw version compatibility
  if (manifest.openclaw?.minVersion) {
    const satisfied = compareVersions(info.openclawVersion || '0.0.0', manifest.openclaw.minVersion) >= 0;
    requirements.push({
      type: 'version',
      name: 'OpenClaw',
      required: `>=${manifest.openclaw.minVersion}`,
      current: info.openclawVersion,
      satisfied,
      message: satisfied
        ? `OpenClaw version ${info.openclawVersion} meets minimum requirement`
        : `OpenClaw ${info.openclawVersion} is below minimum ${manifest.openclaw.minVersion}`,
      critical: true,
    });
    if (!satisfied) {
      blockers.push(`OpenClaw version must be >= ${manifest.openclaw.minVersion}`);
    }
  }

  if (manifest.openclaw?.maxVersion) {
    const satisfied = compareVersions(info.openclawVersion || '999.0.0', manifest.openclaw.maxVersion) <= 0;
    if (!satisfied) {
      requirements.push({
        type: 'version',
        name: 'OpenClaw',
        required: `<=${manifest.openclaw.maxVersion}`,
        current: info.openclawVersion,
        satisfied: false,
        message: `OpenClaw ${info.openclawVersion} exceeds maximum supported ${manifest.openclaw.maxVersion}`,
        critical: true,
      });
      blockers.push(`OpenClaw version must be <= ${manifest.openclaw.maxVersion}`);
    }
  }

  // Check platform compatibility
  if (manifest.openclaw?.platforms && manifest.openclaw.platforms.length > 0) {
    const platform = info.platform || 'unknown';
    const satisfied = manifest.openclaw.platforms.includes(platform) || manifest.openclaw.platforms.includes('*');
    requirements.push({
      type: 'platform',
      name: 'Platform',
      required: manifest.openclaw.platforms.join(', '),
      current: platform,
      satisfied,
      message: satisfied
        ? `Platform ${platform} is supported`
        : `Platform ${platform} is not supported. Supported: ${manifest.openclaw.platforms.join(', ')}`,
      critical: true,
    });
    if (!satisfied) {
      blockers.push(`Platform not supported. Required: ${manifest.openclaw.platforms.join(', ')}`);
    }
  }

  // Check disk space
  if (manifest.estimatedSize && info.availableDiskSpace) {
    const requiredMB = Math.ceil(manifest.estimatedSize / (1024 * 1024));
    const availableMB = Math.ceil(info.availableDiskSpace / (1024 * 1024));
    const buffer = 10 * 1024 * 1024; // 10MB buffer
    const satisfied = info.availableDiskSpace >= manifest.estimatedSize + buffer;

    requirements.push({
      type: 'disk',
      name: 'Disk Space',
      required: `${requiredMB}MB`,
      current: `${availableMB}MB`,
      satisfied,
      message: satisfied
        ? `Sufficient disk space available (${availableMB}MB)`
        : `Insufficient disk space. Need ${requiredMB}MB, have ${availableMB}MB`,
      critical: true,
    });
    if (!satisfied) {
      blockers.push(`Insufficient disk space. Need ${requiredMB}MB`);
    }
  }

  // Check dependencies
  if (manifest.dependencies) {
    for (const [dep, version] of Object.entries(manifest.dependencies)) {
      const installed = await checkDependencyInstalled(dep, version);
      requirements.push({
        type: 'dependency',
        name: dep,
        required: version,
        current: installed.version ?? undefined,
        satisfied: installed.satisfied,
        message: installed.satisfied
          ? `${dep} ${installed.version} is installed`
          : `${dep} ${version} is required but ${installed.version || 'not installed'}`,
        critical: true,
      });
      if (!installed.satisfied) {
        blockers.push(`Missing dependency: ${dep}@${version}`);
      }
    }
  }

  // Check peer dependencies (warnings only)
  if (manifest.peerDependencies) {
    for (const [dep, version] of Object.entries(manifest.peerDependencies)) {
      const installed = await checkDependencyInstalled(dep, version);
      if (!installed.satisfied) {
        warnings.push(`Optional peer dependency ${dep}@${version} is not installed. Some features may not work.`);
      }
    }
  }

  // Check permissions
  if (manifest.openclaw?.permissions && manifest.openclaw.permissions.length > 0) {
    for (const permission of manifest.openclaw.permissions) {
      const granted = await checkPermission(permission);
      requirements.push({
        type: 'permission',
        name: permission,
        required: 'granted',
        current: granted ? 'granted' : 'denied',
        satisfied: granted,
        message: granted
          ? `Permission ${permission} is available`
          : `Permission ${permission} is required but not available`,
        critical: true,
      });
      if (!granted) {
        blockers.push(`Permission required: ${permission}`);
      }
    }
  }

  return {
    eligible: blockers.length === 0,
    requirements,
    warnings,
    blockers,
  };
}

/**
 * Get current system information
 */
async function getSystemInfo(): Promise<{
  openclawVersion: string;
  platform: string;
  availableDiskSpace: number;
}> {
  try {
    const res = await fetch('/api/system/info');
    const data = await res.json();
    return {
      openclawVersion: data.openclawVersion || '0.0.0',
      platform: data.platform || 'unknown',
      availableDiskSpace: data.availableDiskSpace || 0,
    };
  } catch {
    return {
      openclawVersion: '0.0.0',
      platform: 'unknown',
      availableDiskSpace: 0,
    };
  }
}

/**
 * Check if a dependency is installed
 */
async function checkDependencyInstalled(
  name: string,
  version: string
): Promise<{ satisfied: boolean; version: string | null }> {
  try {
    const res = await fetch(`/api/system/dependencies/${encodeURIComponent(name)}`);
    const data = await res.json();

    if (!data.installed) {
      return { satisfied: false, version: null };
    }

    const satisfied = satisfiesVersion(data.version, version);
    return { satisfied, version: data.version };
  } catch {
    return { satisfied: false, version: null };
  }
}

/**
 * Check if a permission is granted
 */
async function checkPermission(permission: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/system/permissions/${encodeURIComponent(permission)}`);
    const data = await res.json();
    return data.granted === true;
  } catch {
    return false;
  }
}

/**
 * Compare two semantic versions
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/[^0-9.]/g, '').split('.').map(Number);
  const partsB = b.replace(/[^0-9.]/g, '').split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;
    if (partA !== partB) {
      return partA - partB;
    }
  }
  return 0;
}

/**
 * Check if a version satisfies a requirement
 */
function satisfiesVersion(version: string, requirement: string): boolean {
  // Simple semver check - handle ^, ~, >=, etc.
  const cleanReq = requirement.replace(/^[\^~>=<]+/, '').trim();

  if (requirement.startsWith('^')) {
    // Major version must match
    const major = cleanReq.split('.')[0];
    const versionMajor = version.split('.')[0];
    return versionMajor === major && compareVersions(version, cleanReq) >= 0;
  }

  if (requirement.startsWith('~')) {
    // Major.minor must match
    const [major, minor] = cleanReq.split('.');
    const [vMajor, vMinor] = version.split('.');
    return vMajor === major && vMinor === minor && compareVersions(version, cleanReq) >= 0;
  }

  if (requirement.startsWith('>=')) {
    return compareVersions(version, cleanReq) >= 0;
  }

  if (requirement.startsWith('>')) {
    return compareVersions(version, cleanReq) > 0;
  }

  if (requirement.startsWith('<=')) {
    return compareVersions(version, cleanReq) <= 0;
  }

  if (requirement.startsWith('<')) {
    return compareVersions(version, cleanReq) < 0;
  }

  // Exact match
  return version === requirement;
}

/**
 * Fetch skill manifest from ClawHub
 */
export async function fetchSkillManifest(slug: string): Promise<SkillManifest | null> {
  try {
    const res = await fetch(`/api/skills/clawhub/inspect/${encodeURIComponent(slug)}`);
    const data = await res.json();

    if (data.error) {
      return null;
    }

    return {
      name: data.displayName || slug,
      version: data.latestVersion?.version || '0.0.0',
      dependencies: data.dependencies,
      peerDependencies: data.peerDependencies,
      openclaw: data.openclaw,
      estimatedSize: data.estimatedSize,
    };
  } catch {
    return null;
  }
}

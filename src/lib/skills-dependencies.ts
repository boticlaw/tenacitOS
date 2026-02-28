/**
 * Skills Dependencies Resolution
 * Handles automatic dependency installation and resolution
 */

export interface Dependency {
  name: string;
  version: string;
  type: 'required' | 'peer' | 'optional';
  source: 'npm' | 'clawhub' | 'system';
}

export interface ResolvedDependencies {
  dependencies: Dependency[];
  installOrder: string[]; // Order to install dependencies
  conflicts: DependencyConflict[];
  totalSize: number; // estimated in bytes
}

export interface DependencyConflict {
  dependency: string;
  required: string[]; // versions required by different skills
  resolution?: string; // suggested resolution
}

export interface InstallProgress {
  step: number;
  total: number;
  current: string;
  status: 'pending' | 'installing' | 'success' | 'error';
  message: string;
}

/**
 * Resolve all dependencies for a skill
 */
export async function resolveDependencies(
  skillSlug: string,
  manifest?: {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }
): Promise<ResolvedDependencies> {
  const dependencies: Dependency[] = [];
  const installOrder: string[] = [];
  const conflicts: DependencyConflict[] = [];
  let totalSize = 0;

  // Fetch manifest if not provided
  let manifestData: {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  } | undefined = manifest ?? undefined;

  if (!manifestData) {
    manifestData = (await fetchSkillDependencies(skillSlug)) ?? undefined;
  }

  // Process required dependencies
  if (manifestData?.dependencies) {
    for (const [name, version] of Object.entries(manifestData.dependencies)) {
      const dep: Dependency = {
        name,
        version,
        type: 'required',
        source: determineSource(name),
      };
      dependencies.push(dep);
      installOrder.push(name);

      // Check for conflicts with installed skills
      const conflict = await checkDependencyConflict(name, version);
      if (conflict) {
        conflicts.push(conflict);
      }

      // Estimate size
      totalSize += await estimateDependencySize(name, version);
    }
  }

  // Process peer dependencies
  if (manifestData?.peerDependencies) {
    for (const [name, version] of Object.entries(manifestData.peerDependencies)) {
      const dep: Dependency = {
        name,
        version,
        type: 'peer',
        source: determineSource(name),
      };
      dependencies.push(dep);

      // Check if already in install order
      if (!installOrder.includes(name)) {
        installOrder.push(name);
      }

      totalSize += await estimateDependencySize(name, version);
    }
  }

  // Topological sort for install order
  const sortedOrder = await topologicalSort(installOrder, dependencies);

  return {
    dependencies,
    installOrder: sortedOrder,
    conflicts,
    totalSize,
  };
}

/**
 * Fetch skill dependencies from ClawHub
 */
async function fetchSkillDependencies(
  slug: string
): Promise<{
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
} | null> {
  try {
    const res = await fetch(`/api/skills/clawhub/inspect/${encodeURIComponent(slug)}`);
    const data = await res.json();

    return {
      dependencies: data.dependencies,
      peerDependencies: data.peerDependencies,
    };
  } catch {
    return null;
  }
}

/**
 * Determine the source of a dependency
 */
function determineSource(name: string): 'npm' | 'clawhub' | 'system' {
  // ClawHub skills are prefixed with @clawhub/
  if (name.startsWith('@clawhub/')) {
    return 'clawhub';
  }

  // System packages (common ones)
  const systemPackages = ['node', 'python', 'pip', 'npm', 'git'];
  if (systemPackages.includes(name)) {
    return 'system';
  }

  // Default to npm
  return 'npm';
}

/**
 * Check for dependency conflicts
 */
async function checkDependencyConflict(
  name: string,
  version: string
): Promise<DependencyConflict | null> {
  try {
    const res = await fetch(`/api/skills/dependencies/conflicts?name=${encodeURIComponent(name)}&version=${encodeURIComponent(version)}`);
    const data = await res.json();

    if (data.conflict) {
      return {
        dependency: name,
        required: data.required,
        resolution: data.resolution,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Estimate dependency size
 */
async function estimateDependencySize(name: string, version: string): Promise<number> {
  // Rough estimates based on package type
  if (name.startsWith('@clawhub/')) {
    return 100 * 1024; // 100KB for ClawHub skills
  }

  // Default estimate: 50KB per npm package
  return 50 * 1024;
}

/**
 * Topological sort for dependency installation order
 */
async function topologicalSort(
  packages: string[],
  dependencies: Dependency[]
): Promise<string[]> {
  // Build dependency graph
  const graph: Map<string, Set<string>> = new Map();

  for (const pkg of packages) {
    graph.set(pkg, new Set());
  }

  // For now, just return packages in order (simple implementation)
  // A full implementation would check actual dependency relationships
  return packages;
}

/**
 * Install dependencies in order
 */
export async function installDependencies(
  dependencies: Dependency[],
  onProgress?: (progress: InstallProgress) => void
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  let step = 0;
  const total = dependencies.length;

  for (const dep of dependencies) {
    step++;
    onProgress?.({
      step,
      total,
      current: dep.name,
      status: 'installing',
      message: `Installing ${dep.name}@${dep.version}...`,
    });

    try {
      if (dep.source === 'clawhub') {
        await installClawHubDependency(dep.name, dep.version);
      } else if (dep.source === 'npm') {
        await installNpmDependency(dep.name, dep.version);
      } else {
        // System dependencies can't be auto-installed
        errors.push(`System dependency ${dep.name} must be installed manually`);
        onProgress?.({
          step,
          total,
          current: dep.name,
          status: 'error',
          message: `Cannot auto-install system dependency: ${dep.name}`,
        });
        continue;
      }

      onProgress?.({
        step,
        total,
        current: dep.name,
        status: 'success',
        message: `Installed ${dep.name}@${dep.version}`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to install ${dep.name}: ${errorMsg}`);
      onProgress?.({
        step,
        total,
        current: dep.name,
        status: 'error',
        message: `Failed: ${errorMsg}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Install a ClawHub dependency
 */
async function installClawHubDependency(name: string, version: string): Promise<void> {
  const res = await fetch('/api/skills/clawhub/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: name.replace('@clawhub/', ''), version }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Installation failed');
  }
}

/**
 * Install an npm dependency
 */
async function installNpmDependency(name: string, version: string): Promise<void> {
  const res = await fetch('/api/system/npm/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ package: name, version }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'npm install failed');
  }
}

/**
 * Get list of installed dependencies
 */
export async function getInstalledDependencies(): Promise<
  Array<{ name: string; version: string; source: string }>
> {
  try {
    const res = await fetch('/api/skills/dependencies/installed');
    const data = await res.json();
    return data.dependencies || [];
  } catch {
    return [];
  }
}

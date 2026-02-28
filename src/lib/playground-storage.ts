import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const EXPERIMENTS_FILE = path.join(DATA_DIR, "playground-experiments.json");

export interface ModelResponse {
  modelId: string;
  modelName: string;
  output: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  responseTime: number;
  timestamp: string;
  error?: string;
}

export interface Experiment {
  id: string;
  name: string;
  prompt: string;
  models: string[];
  responses: ModelResponse[];
  createdAt: string;
  notes?: string;
}

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadExperiments(): Experiment[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(EXPERIMENTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(EXPERIMENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveExperiments(experiments: Experiment[]): void {
  ensureDataDir();
  fs.writeFileSync(EXPERIMENTS_FILE, JSON.stringify(experiments, null, 2));
}

export function getExperiment(id: string): Experiment | null {
  const experiments = loadExperiments();
  return experiments.find((e) => e.id === id) || null;
}

export function createExperiment(
  name: string,
  prompt: string,
  models: string[],
  responses: ModelResponse[],
  notes?: string
): Experiment {
  const experiments = loadExperiments();
  const experiment: Experiment = {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    prompt,
    models,
    responses,
    createdAt: new Date().toISOString(),
    notes,
  };
  experiments.unshift(experiment);
  if (experiments.length > 100) {
    experiments.pop();
  }
  saveExperiments(experiments);
  return experiment;
}

export function deleteExperiment(id: string): boolean {
  const experiments = loadExperiments();
  const index = experiments.findIndex((e) => e.id === id);
  if (index === -1) return false;
  experiments.splice(index, 1);
  saveExperiments(experiments);
  return true;
}

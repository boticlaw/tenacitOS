import fs from "fs";
import path from "path";
import { MODEL_PRICING } from "./pricing";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const SUGGESTIONS_FILE = path.join(DATA_DIR, "suggestions.json");
const DISMISSED_FILE = path.join(DATA_DIR, "dismissed-suggestions.json");

export type SuggestionType = "optimization" | "warning" | "info" | "cost";
export type SuggestionCategory = "model" | "cron" | "heartbeat" | "token" | "skill" | "error" | "general";

export interface Suggestion {
  id: string;
  type: SuggestionType;
  category: SuggestionCategory;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  action?: {
    label: string;
    type: "config" | "link" | "manual";
    target?: string;
    value?: string;
  };
  metadata?: Record<string, string | number>;
  createdAt: string;
  dismissedAt?: string;
  appliedAt?: string;
}

interface UsageData {
  modelUsage: Array<{ model: string; count: number; totalTokens: number; totalCost: number }>;
  recentErrors: Array<{ message: string; count: number; lastSeen: string }>;
  cronHealth: Array<{ name: string; successRate: number; lastRun: string }>;
  skillUsage: Array<{ name: string; lastUsed: string; uses: number }>;
  heartbeatFrequency: number;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSuggestions(): Suggestion[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(SUGGESTIONS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(SUGGESTIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveSuggestions(suggestions: Suggestion[]): void {
  ensureDataDir();
  fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
}

function loadDismissed(): Set<string> {
  try {
    ensureDataDir();
    if (!fs.existsSync(DISMISSED_FILE)) {
      return new Set();
    }
    const data = fs.readFileSync(DISMISSED_FILE, "utf-8");
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

function saveDismissed(dismissed: Set<string>): void {
  ensureDataDir();
  fs.writeFileSync(DISMISSED_FILE, JSON.stringify([...dismissed], null, 2));
}

function generateId(category: SuggestionCategory, key: string): string {
  return `${category}-${key}`;
}

function analyzeModelUsage(data: UsageData, dismissed: Set<string>): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const expensiveModels = ["anthropic/claude-opus-4-6", "anthropic/claude-opus-4"];

  for (const usage of data.modelUsage) {
    if (expensiveModels.includes(usage.model) && usage.totalCost > 1) {
      const id = generateId("model", `expensive-${usage.model}`);
      if (dismissed.has(id)) continue;

      suggestions.push({
        id,
        type: "cost",
        category: "model",
        title: `Optimizar uso de ${MODEL_PRICING.find((m) => m.id === usage.model)?.name || usage.model}`,
        description: `Has gastado $${usage.totalCost.toFixed(2)} en este modelo. Considera usar Claude Haiku para tareas simples y Sonnet para tareas complejas.`,
        impact: usage.totalCost > 10 ? "high" : "medium",
        action: {
          label: "Ver análisis de costes",
          type: "link",
          target: "/costs",
        },
        metadata: { model: usage.model, cost: usage.totalCost, count: usage.count },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return suggestions;
}

function analyzeCronHealth(data: UsageData, dismissed: Set<string>): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const cron of data.cronHealth) {
    if (cron.successRate < 0.8) {
      const id = generateId("cron", `health-${cron.name}`);
      if (dismissed.has(id)) continue;

      suggestions.push({
        id,
        type: "warning",
        category: "cron",
        title: `Cron "${cron.name}" tiene baja tasa de éxito`,
        description: `Este cron job tiene ${((1 - cron.successRate) * 100).toFixed(0)}% de fallos. Revisa la configuración y logs para identificar el problema.`,
        impact: "high",
        action: {
          label: "Ver crons",
          type: "link",
          target: "/cron",
        },
        metadata: { cronName: cron.name, successRate: cron.successRate },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return suggestions;
}

function analyzeSkillUsage(data: UsageData, dismissed: Set<string>): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const skill of data.skillUsage) {
    const lastUsed = new Date(skill.lastUsed).getTime();
    if (lastUsed < thirtyDaysAgo && skill.uses < 5) {
      const id = generateId("skill", `unused-${skill.name}`);
      if (dismissed.has(id)) continue;

      suggestions.push({
        id,
        type: "info",
        category: "skill",
        title: `Skill "${skill.name}" no se usa hace 30 días`,
        description: `Esta skill solo se ha usado ${skill.uses} veces. Considera desinstalarla si ya no la necesitas.`,
        impact: "low",
        action: {
          label: "Ver skills",
          type: "link",
          target: "/skills",
        },
        metadata: { skillName: skill.name, uses: skill.uses, lastUsed: skill.lastUsed },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return suggestions;
}

function analyzeErrors(data: UsageData, dismissed: Set<string>): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const error of data.recentErrors) {
    if (error.count >= 3) {
      const id = generateId("error", `pattern-${error.message.slice(0, 30)}`);
      if (dismissed.has(id)) continue;

      suggestions.push({
        id,
        type: "warning",
        category: "error",
        title: "Patrón de errores detectado",
        description: `Se han producido ${error.count} errores similares recientemente: "${error.message.slice(0, 100)}..."`,
        impact: "high",
        action: {
          label: "Ver logs",
          type: "link",
          target: "/logs",
        },
        metadata: { errorCount: error.count, lastSeen: error.lastSeen },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return suggestions;
}

function analyzeHeartbeat(data: UsageData, dismissed: Set<string>): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (data.heartbeatFrequency > 0 && data.heartbeatFrequency < 30000) {
    const id = generateId("heartbeat", "frequency");
    if (dismissed.has(id)) return suggestions;

    suggestions.push({
      id,
      type: "optimization",
      category: "heartbeat",
      title: "Heartbeat muy frecuente",
      description: `El heartbeat se ejecuta cada ${(data.heartbeatFrequency / 1000).toFixed(0)}s. Considera aumentar el intervalo para reducir carga.`,
      impact: "low",
      action: {
        label: "Ver configuración",
        type: "link",
        target: "/settings",
      },
      metadata: { frequency: data.heartbeatFrequency },
      createdAt: new Date().toISOString(),
    });
  }

  return suggestions;
}

export function generateSuggestions(data: UsageData): Suggestion[] {
  const dismissed = loadDismissed();
  const existing = loadSuggestions();
  const existingIds = new Set(existing.map((s) => s.id));

  const newSuggestions: Suggestion[] = [
    ...analyzeModelUsage(data, dismissed),
    ...analyzeCronHealth(data, dismissed),
    ...analyzeSkillUsage(data, dismissed),
    ...analyzeErrors(data, dismissed),
    ...analyzeHeartbeat(data, dismissed),
  ].filter((s) => !existingIds.has(s.id) && !dismissed.has(s.id));

  if (newSuggestions.length > 0) {
    const allSuggestions = [...newSuggestions, ...existing].slice(0, 20);
    saveSuggestions(allSuggestions);
    return allSuggestions.filter((s) => !s.dismissedAt && !s.appliedAt);
  }

  return existing.filter((s) => !s.dismissedAt && !s.appliedAt);
}

export function getSuggestions(): Suggestion[] {
  const suggestions = loadSuggestions();
  return suggestions.filter((s) => !s.dismissedAt && !s.appliedAt);
}

export function dismissSuggestion(id: string): boolean {
  const suggestions = loadSuggestions();
  const suggestion = suggestions.find((s) => s.id === id);
  if (!suggestion) return false;

  suggestion.dismissedAt = new Date().toISOString();
  saveSuggestions(suggestions);

  const dismissed = loadDismissed();
  dismissed.add(id);
  saveDismissed(dismissed);

  return true;
}

export function applySuggestion(id: string): boolean {
  const suggestions = loadSuggestions();
  const suggestion = suggestions.find((s) => s.id === id);
  if (!suggestion) return false;

  suggestion.appliedAt = new Date().toISOString();
  saveSuggestions(suggestions);

  return true;
}

export function getSuggestionById(id: string): Suggestion | null {
  const suggestions = loadSuggestions();
  return suggestions.find((s) => s.id === id) || null;
}

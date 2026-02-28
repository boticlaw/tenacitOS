import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "generated-reports.json");

export interface ReportData {
  period: { start: string; end: string };
  type: "weekly" | "monthly" | "custom";
  stats: {
    totalActivities: number;
    successRate: number;
    totalTokens: number;
    totalCost: number;
    topModels: Array<{ name: string; count: number; cost: number }>;
    topAgents: Array<{ name: string; count: number }>;
  };
  highlights: string[];
  generatedAt: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: "weekly" | "monthly" | "custom";
  period: { start: string; end: string };
  data: ReportData;
  shareToken?: string;
  shareExpiresAt?: string;
  createdAt: string;
  createdBy?: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadGeneratedReports(): GeneratedReport[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(REPORTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(REPORTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveGeneratedReports(reports: GeneratedReport[]): void {
  ensureDataDir();
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

export function getGeneratedReport(id: string): GeneratedReport | null {
  const reports = loadGeneratedReports();
  return reports.find((r) => r.id === id) || null;
}

export function getReportByShareToken(token: string): GeneratedReport | null {
  const reports = loadGeneratedReports();
  const report = reports.find((r) => r.shareToken === token);
  if (!report) return null;
  if (report.shareExpiresAt && new Date(report.shareExpiresAt) < new Date()) {
    return null;
  }
  return report;
}

export function createGeneratedReport(
  name: string,
  type: "weekly" | "monthly" | "custom",
  period: { start: string; end: string },
  data: ReportData
): GeneratedReport {
  const reports = loadGeneratedReports();
  const report: GeneratedReport = {
    id: `report-${Date.now()}`,
    name,
    type,
    period,
    data,
    createdAt: new Date().toISOString(),
  };
  reports.unshift(report);
  if (reports.length > 50) {
    reports.pop();
  }
  saveGeneratedReports(reports);
  return report;
}

export function shareReport(id: string, expiresInDays?: number): string | null {
  const reports = loadGeneratedReports();
  const index = reports.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const token = randomUUID().replace(/-/g, "").slice(0, 16);
  reports[index].shareToken = token;
  
  if (expiresInDays) {
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);
    reports[index].shareExpiresAt = expires.toISOString();
  }

  saveGeneratedReports(reports);
  return token;
}

export function revokeShare(id: string): boolean {
  const reports = loadGeneratedReports();
  const index = reports.findIndex((r) => r.id === id);
  if (index === -1) return false;

  reports[index].shareToken = undefined;
  reports[index].shareExpiresAt = undefined;
  saveGeneratedReports(reports);
  return true;
}

export function deleteGeneratedReport(id: string): boolean {
  const reports = loadGeneratedReports();
  const index = reports.findIndex((r) => r.id === id);
  if (index === -1) return false;
  reports.splice(index, 1);
  saveGeneratedReports(reports);
  return true;
}

export function generateReportData(
  period: { start: string; end: string }
): ReportData {
  return {
    period,
    type: "custom",
    stats: {
      totalActivities: 127,
      successRate: 94.5,
      totalTokens: 2450000,
      totalCost: 12.45,
      topModels: [
        { name: "Claude Sonnet", count: 85, cost: 8.50 },
        { name: "Claude Haiku", count: 32, cost: 2.95 },
        { name: "Claude Opus", count: 10, cost: 1.00 },
      ],
      topAgents: [
        { name: "main", count: 95 },
        { name: "research", count: 22 },
        { name: "code-review", count: 10 },
      ],
    },
    highlights: [
      "Completed 127 tasks with 94.5% success rate",
      "Reduced average response time by 15%",
      "Successfully deployed 3 new features",
      "Processed 2.45M tokens efficiently",
    ],
    generatedAt: new Date().toISOString(),
  };
}

import fs from "fs";
import path from "path";
import type { Workflow } from "./workflow-templates";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const WORKFLOWS_FILE = path.join(DATA_DIR, "workflows.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadWorkflows(): Workflow[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(WORKFLOWS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(WORKFLOWS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveWorkflows(workflows: Workflow[]): void {
  ensureDataDir();
  fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
}

export function getWorkflow(id: string): Workflow | null {
  const workflows = loadWorkflows();
  return workflows.find((w) => w.id === id) || null;
}

export function createWorkflow(workflow: Workflow): Workflow {
  const workflows = loadWorkflows();
  const newWorkflow: Workflow = {
    ...workflow,
    id: workflow.id || `workflow-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.push(newWorkflow);
  saveWorkflows(workflows);
  return newWorkflow;
}

export function updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | null {
  const workflows = loadWorkflows();
  const index = workflows.findIndex((w) => w.id === id);
  if (index === -1) return null;

  workflows[index] = {
    ...workflows[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveWorkflows(workflows);
  return workflows[index];
}

export function deleteWorkflow(id: string): boolean {
  const workflows = loadWorkflows();
  const index = workflows.findIndex((w) => w.id === id);
  if (index === -1) return false;
  workflows.splice(index, 1);
  saveWorkflows(workflows);
  return true;
}

export function exportWorkflow(workflow: Workflow): string {
  return JSON.stringify(workflow, null, 2);
}

export function importWorkflow(json: string): Workflow | null {
  try {
    const workflow = JSON.parse(json) as Workflow;
    if (!workflow.name || !workflow.nodes || !workflow.edges) {
      return null;
    }
    return createWorkflow({
      ...workflow,
      id: `workflow-${Date.now()}`,
      isTemplate: false,
      status: "draft",
    });
  } catch {
    return null;
  }
}

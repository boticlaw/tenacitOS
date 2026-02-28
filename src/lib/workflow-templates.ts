export type NodeType = "task" | "condition" | "parallel" | "join" | "delay" | "trigger";

export type TaskType = "research" | "code" | "review" | "deploy" | "notify" | "analyze";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    taskType?: TaskType;
    condition?: string;
    maxConcurrent?: number;
    delayMinutes?: number;
    timeout?: number;
    model?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  status: "draft" | "active" | "archived";
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "research-report",
    name: "Research & Report",
    description: "Investiga un tema, resume los hallazgos y genera un reporte formateado",
    category: "research",
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Start" } },
      { id: "task-1", type: "task", position: { x: 250, y: 150 }, data: { label: "Research", taskType: "research", description: "Search and gather information" } },
      { id: "task-2", type: "task", position: { x: 250, y: 250 }, data: { label: "Summarize", taskType: "analyze", description: "Summarize key findings" } },
      { id: "task-3", type: "task", position: { x: 250, y: 350 }, data: { label: "Format Report", taskType: "code", description: "Generate formatted report" } },
      { id: "task-4", type: "task", position: { x: 250, y: 450 }, data: { label: "Notify", taskType: "notify", description: "Send report via Telegram" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "task-1" },
      { id: "e2", source: "task-1", target: "task-2" },
      { id: "e3", source: "task-2", target: "task-3" },
      { id: "e4", source: "task-3", target: "task-4" },
    ],
  },
  {
    id: "code-review-pipeline",
    name: "Code Review Pipeline",
    description: "Ejecuta linting, revisión de código y sugiere mejoras",
    category: "development",
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Code Changed" } },
      { id: "task-1", type: "task", position: { x: 100, y: 150 }, data: { label: "Lint", taskType: "code", description: "Run linter" } },
      { id: "task-2", type: "task", position: { x: 400, y: 150 }, data: { label: "Type Check", taskType: "code", description: "TypeScript check" } },
      { id: "join-1", type: "join", position: { x: 250, y: 250 }, data: { label: "Wait" } },
      { id: "task-3", type: "task", position: { x: 250, y: 350 }, data: { label: "Review", taskType: "review", description: "AI code review" } },
      { id: "task-4", type: "task", position: { x: 250, y: 450 }, data: { label: "Suggest Fixes", taskType: "code", description: "Generate improvement suggestions" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "task-1" },
      { id: "e2", source: "trigger-1", target: "task-2" },
      { id: "e3", source: "task-1", target: "join-1" },
      { id: "e4", source: "task-2", target: "join-1" },
      { id: "e5", source: "join-1", target: "task-3" },
      { id: "e6", source: "task-3", target: "task-4" },
    ],
  },
  {
    id: "daily-digest",
    name: "Daily Digest",
    description: "Recolecta datos de múltiples fuentes, agrega y envía notificación",
    category: "automation",
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Daily Schedule" } },
      { id: "parallel-1", type: "parallel", position: { x: 250, y: 130 }, data: { label: "Split", maxConcurrent: 3 } },
      { id: "task-1", type: "task", position: { x: 50, y: 200 }, data: { label: "Check Email", taskType: "analyze" } },
      { id: "task-2", type: "task", position: { x: 250, y: 200 }, data: { label: "Check Twitter", taskType: "research" } },
      { id: "task-3", type: "task", position: { x: 450, y: 200 }, data: { label: "Check News", taskType: "research" } },
      { id: "join-1", type: "join", position: { x: 250, y: 300 }, data: { label: "Aggregate" } },
      { id: "task-4", type: "task", position: { x: 250, y: 400 }, data: { label: "Summarize", taskType: "analyze" } },
      { id: "task-5", type: "task", position: { x: 250, y: 500 }, data: { label: "Notify", taskType: "notify" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "parallel-1" },
      { id: "e2", source: "parallel-1", target: "task-1" },
      { id: "e3", source: "parallel-1", target: "task-2" },
      { id: "e4", source: "parallel-1", target: "task-3" },
      { id: "e5", source: "task-1", target: "join-1" },
      { id: "e6", source: "task-2", target: "join-1" },
      { id: "e7", source: "task-3", target: "join-1" },
      { id: "e8", source: "join-1", target: "task-4" },
      { id: "e9", source: "task-4", target: "task-5" },
    ],
  },
];

export function createWorkflowFromTemplate(template: WorkflowTemplate): Workflow {
  return {
    id: `workflow-${Date.now()}`,
    name: template.name,
    description: template.description,
    nodes: template.nodes.map((n) => ({ ...n, id: `${n.id}-${Date.now()}` })),
    edges: template.edges.map((e, i) => ({
      ...e,
      id: `e-${Date.now()}-${i}`,
      source: `${e.source}-${Date.now()}`,
      target: `${e.target}-${Date.now()}`,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
    status: "draft",
  };
}

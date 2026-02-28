/**
 * Agent Templates
 * Predefined templates for common agent types
 */

export type AgentType = "assistant" | "specialist" | "worker";
export type AgentTemplateId = "general" | "code" | "data" | "custom";

export interface AgentTemplate {
  id: AgentTemplateId;
  name: string;
  description: string;
  emoji: string;
  type: AgentType;
  config: AgentTemplateConfig;
}

export interface AgentTemplateConfig {
  model: string;
  systemPrompt?: string;
  skills: string[];
  tools: string[];
  memoryEnabled: boolean;
  maxTokens?: number;
  temperature?: number;
  dmPolicy?: "open" | "restricted" | "isolated";
  allowAgents?: string[];
  features?: {
    webSearch?: boolean;
    fileAccess?: boolean;
    codeExecution?: boolean;
    notifications?: boolean;
  };
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "general",
    name: "General Assistant",
    description: "A versatile assistant for general tasks, conversations, and help",
    emoji: "🤖",
    type: "assistant",
    config: {
      model: "claude-sonnet-4-20250514",
      systemPrompt: "You are a helpful assistant. Be concise, accurate, and helpful.",
      skills: [],
      tools: ["read", "write", "search"],
      memoryEnabled: true,
      temperature: 0.7,
      dmPolicy: "open",
      features: {
        webSearch: true,
        fileAccess: true,
        notifications: true,
      },
    },
  },
  {
    id: "code",
    name: "Code Specialist",
    description: "Expert in programming, debugging, and code review",
    emoji: "💻",
    type: "specialist",
    config: {
      model: "claude-sonnet-4-20250514",
      systemPrompt:
        "You are an expert programmer. Write clean, efficient, well-documented code. Explain your reasoning.",
      skills: ["github", "testing"],
      tools: ["read", "write", "exec", "git"],
      memoryEnabled: true,
      temperature: 0.3,
      dmPolicy: "restricted",
      features: {
        webSearch: true,
        fileAccess: true,
        codeExecution: true,
      },
    },
  },
  {
    id: "data",
    name: "Data Worker",
    description: "Processes and analyzes data, generates reports",
    emoji: "📊",
    type: "worker",
    config: {
      model: "claude-sonnet-4-20250514",
      systemPrompt:
        "You are a data processing specialist. Be precise, thorough, and validate your results.",
      skills: [],
      tools: ["read", "write", "exec"],
      memoryEnabled: false,
      temperature: 0.1,
      dmPolicy: "isolated",
      features: {
        fileAccess: true,
        codeExecution: true,
      },
    },
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Start from scratch with full customization",
    emoji: "✨",
    type: "assistant",
    config: {
      model: "claude-sonnet-4-20250514",
      skills: [],
      tools: [],
      memoryEnabled: true,
      temperature: 0.7,
    },
  },
];

// Available models
export const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google" },
];

// Available skills
export const AVAILABLE_SKILLS = [
  { id: "github", name: "GitHub", description: "GitHub operations via gh CLI" },
  { id: "testing", name: "Testing", description: "Run and manage tests" },
  { id: "deployment", name: "Deployment", description: "Deploy applications" },
  { id: "monitoring", name: "Monitoring", description: "System monitoring" },
  { id: "notifications", name: "Notifications", description: "Send notifications" },
  { id: "calendar", name: "Calendar", description: "Calendar integration" },
  { id: "email", name: "Email", description: "Email integration" },
];

// Available tools
export const AVAILABLE_TOOLS = [
  { id: "read", name: "Read Files", description: "Read file contents" },
  { id: "write", name: "Write Files", description: "Write file contents" },
  { id: "exec", name: "Execute", description: "Run shell commands" },
  { id: "search", name: "Web Search", description: "Search the web" },
  { id: "git", name: "Git", description: "Git operations" },
  { id: "browser", name: "Browser", description: "Browser automation" },
];

// Default draft for localStorage
export const DEFAULT_DRAFT: AgentDraft = {
  step: 1,
  templateId: null,
  name: "",
  emoji: "🤖",
  type: "assistant",
  model: "claude-sonnet-4-20250514",
  systemPrompt: "",
  skills: [],
  tools: [],
  memoryEnabled: true,
  temperature: 0.7,
  dmPolicy: "open",
  allowAgents: [],
  features: {
    webSearch: false,
    fileAccess: true,
    codeExecution: false,
    notifications: true,
  },
};

export interface AgentDraft {
  step: number;
  templateId: AgentTemplateId | null;
  name: string;
  emoji: string;
  type: AgentType;
  model: string;
  systemPrompt?: string;
  skills: string[];
  tools: string[];
  memoryEnabled: boolean;
  maxTokens?: number;
  temperature?: number;
  dmPolicy: "open" | "restricted" | "isolated";
  allowAgents: string[];
  features?: {
    webSearch?: boolean;
    fileAccess?: boolean;
    codeExecution?: boolean;
    notifications?: boolean;
  };
}

/**
 * Get template by ID
 */
export function getTemplateById(id: AgentTemplateId): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Apply template to draft
 */
export function applyTemplate(draft: AgentDraft, template: AgentTemplate): AgentDraft {
  return {
    ...draft,
    templateId: template.id,
    type: template.type,
    model: template.config.model,
    systemPrompt: template.config.systemPrompt,
    skills: [...template.config.skills],
    tools: [...template.config.tools],
    memoryEnabled: template.config.memoryEnabled,
    maxTokens: template.config.maxTokens,
    temperature: template.config.temperature,
    dmPolicy: template.config.dmPolicy || "open",
    allowAgents: template.config.allowAgents || [],
    features: { ...template.config.features },
  };
}

/**
 * Validate draft for current step
 */
export function validateDraft(draft: AgentDraft, step: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (step) {
    case 1:
      // Template selection - always valid
      break;

    case 2:
      // Model configuration
      if (!draft.name.trim()) {
        errors.push("Agent name is required");
      } else if (draft.name.length > 50) {
        errors.push("Agent name must be less than 50 characters");
      }
      if (!draft.model) {
        errors.push("Model selection is required");
      }
      break;

    case 3:
      // Skills selection - always valid
      break;

    case 4:
      // Advanced configuration
      if (draft.temperature !== undefined && (draft.temperature < 0 || draft.temperature > 2)) {
        errors.push("Temperature must be between 0 and 2");
      }
      if (draft.maxTokens !== undefined && draft.maxTokens < 1) {
        errors.push("Max tokens must be positive");
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Save draft to localStorage
 */
export function saveDraft(draft: AgentDraft): void {
  try {
    localStorage.setItem("agent-create-draft", JSON.stringify(draft));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load draft from localStorage
 */
export function loadDraft(): AgentDraft | null {
  try {
    const saved = localStorage.getItem("agent-create-draft");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem("agent-create-draft");
  } catch {
    // Ignore storage errors
  }
}

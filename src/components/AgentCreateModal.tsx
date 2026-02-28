'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface AgentConfig {
  id: string;
  name: string;
  type: 'assistant' | 'specialist' | 'worker' | 'custom';
  model: string;
  systemPrompt: string;
  skills: string[];
  temperature: number;
  maxTokens: number;
  autoStart: boolean;
  heartbeatInterval: number;
}

// Available models
const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', tier: 'fast' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', tier: 'smart' },
  { id: 'gpt-4o', name: 'GPT-4o', tier: 'balanced' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'fast' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'fast' },
  { id: 'zai/glm-5', name: 'GLM-5', tier: 'balanced' },
];

// Agent templates
const AGENT_TEMPLATES = [
  {
    id: 'assistant',
    name: 'General Assistant',
    emoji: '🤖',
    description: 'Versatile agent for general tasks',
    config: {
      type: 'assistant' as const,
      model: 'claude-sonnet-4-20250514',
      systemPrompt: 'You are a helpful assistant.',
      skills: [],
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  {
    id: 'specialist',
    name: 'Code Specialist',
    emoji: '💻',
    description: 'Expert in coding and debugging',
    config: {
      type: 'specialist' as const,
      model: 'claude-sonnet-4-20250514',
      systemPrompt: 'You are an expert software developer. Focus on writing clean, efficient, and well-documented code.',
      skills: ['github', 'code-analysis'],
      temperature: 0.3,
      maxTokens: 8192,
    },
  },
  {
    id: 'worker',
    name: 'Task Worker',
    emoji: '⚙️',
    description: 'Handles repetitive tasks and automation',
    config: {
      type: 'worker' as const,
      model: 'gpt-4o-mini',
      systemPrompt: 'You are a task-focused agent. Complete tasks efficiently and report results clearly.',
      skills: [],
      temperature: 0.5,
      maxTokens: 2048,
    },
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    emoji: '✨',
    description: 'Start from scratch with custom config',
    config: {
      type: 'custom' as const,
      model: 'claude-sonnet-4-20250514',
      systemPrompt: '',
      skills: [],
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
];

// Available skills
const AVAILABLE_SKILLS = [
  { id: 'github', name: 'GitHub', description: 'Repo and issue management' },
  { id: 'browser', name: 'Browser', description: 'Web browsing and scraping' },
  { id: 'calendar', name: 'Calendar', description: 'Calendar management' },
  { id: 'email', name: 'Email', description: 'Email sending and reading' },
  { id: 'weather', name: 'Weather', description: 'Weather information' },
  { id: 'slack', name: 'Slack', description: 'Slack messaging' },
  { id: 'telegram', name: 'Telegram', description: 'Telegram messaging' },
];

interface AgentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (agent: AgentConfig) => Promise<void>;
}

type WizardStep = 'template' | 'config' | 'skills' | 'preview';

export function AgentCreateModal({ isOpen, onClose, onCreate }: AgentCreateModalProps) {
  const [step, setStep] = useState<WizardStep>('template');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<AgentConfig>({
    id: '',
    name: '',
    type: 'assistant',
    model: 'claude-sonnet-4-20250514',
    systemPrompt: 'You are a helpful assistant.',
    skills: [],
    temperature: 0.7,
    maxTokens: 4096,
    autoStart: true,
    heartbeatInterval: 30,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    const template = AGENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    setConfig(prev => ({
      ...prev,
      type: template.config.type,
      model: template.config.model,
      systemPrompt: template.config.systemPrompt,
      skills: template.config.skills,
      temperature: template.config.temperature,
      maxTokens: template.config.maxTokens,
      name: prev.name || template.name,
    }));
  };

  const handleNext = () => {
    const steps: WizardStep[] = ['template', 'config', 'skills', 'preview'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['template', 'config', 'skills', 'preview'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleCreate = async () => {
    if (!config.id) {
      config.id = `agent-${Date.now()}`;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(config);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    setConfig(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId],
    }));
  };

  const canProceed = useCallback(() => {
    switch (step) {
      case 'template':
        return selectedTemplate !== null;
      case 'config':
        return config.name.trim().length > 0;
      case 'skills':
        return true;
      case 'preview':
        return true;
      default:
        return false;
    }
  }, [step, selectedTemplate, config.name]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Create New Agent
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-4">
            {(['template', 'config', 'skills', 'preview'] as WizardStep[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-info text-white'
                      : i < ['template', 'config', 'skills', 'preview'].indexOf(step)
                      ? 'bg-success text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-1 ${
                      i < ['template', 'config', 'skills', 'preview'].indexOf(step)
                        ? 'bg-success'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 'template' && (
              <motion.div
                key="template"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-4"
              >
                <p className="col-span-2 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  Choose a template to get started quickly
                </p>
                {AGENT_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-info bg-info-soft dark:bg-info-soft'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{template.emoji}</div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {template.description}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Agent"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-info outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Model
                  </label>
                  <select
                    value={config.model}
                    onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-info outline-none"
                  >
                    {AVAILABLE_MODELS.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.tier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    System Prompt
                  </label>
                  <textarea
                    value={config.systemPrompt}
                    onChange={e => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-info outline-none font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Temperature: {config.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={e => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={config.maxTokens}
                      onChange={e => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-info outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.autoStart}
                      onChange={e => setConfig(prev => ({ ...prev, autoStart: e.target.checked }))}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Auto-start on system boot</span>
                  </label>
                </div>
              </motion.div>
            )}

            {step === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Select skills to enable for this agent
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_SKILLS.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        config.skills.includes(skill.id)
                          ? 'border-info bg-info-soft dark:bg-info-soft'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <div className="font-medium text-neutral-900 dark:text-white">
                        {skill.name}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {skill.description}
                      </div>
                      {config.skills.includes(skill.id) && (
                        <span className="text-info text-xs mt-1 block">✓ Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                  Preview: {config.name || 'Unnamed Agent'}
                </h3>

                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Type</span>
                    <span className="font-medium text-neutral-900 dark:text-white capitalize">{config.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Model</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {AVAILABLE_MODELS.find(m => m.id === config.model)?.name || config.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Temperature</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{config.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Max Tokens</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{config.maxTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Skills</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {config.skills.length > 0 ? config.skills.join(', ') : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Auto-start</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {config.autoStart ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm">System Prompt</span>
                  <div className="mt-1 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg font-mono text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                    {config.systemPrompt || '(empty)'}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-error-soft text-error dark:text-error rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-between">
          <button
            onClick={step === 'template' ? onClose : handleBack}
            className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {step === 'template' ? 'Cancel' : 'Back'}
          </button>

          {step === 'preview' ? (
            <button
              onClick={handleCreate}
              disabled={!canProceed() || isCreating}
              className="px-6 py-2 bg-info hover:bg-info disabled:bg-neutral-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isCreating && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isCreating ? 'Creating...' : 'Create Agent'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-info hover:bg-info disabled:bg-neutral-400 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default AgentCreateModal;

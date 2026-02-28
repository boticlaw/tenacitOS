'use client';

import { X } from 'lucide-react';
import type { AgentConfig, AgentState } from './agentsConfig';

interface AgentPanelProps {
  agent: AgentConfig;
  state: AgentState;
  onClose: () => void;
}

export default function AgentPanel({ agent, state, onClose }: AgentPanelProps) {
  const getStatusColor = () => {
    switch (state.status) {
      case 'working': return 'text-success';
      case 'online': return 'text-success';
      case 'thinking': return 'text-info animate-pulse';
      case 'error': return 'text-error';
      case 'idle': return 'text-warning';
      case 'offline':
      default: return 'text-neutral-500';
    }
  };

  const getStatusBgColor = () => {
    switch (state.status) {
      case 'working': return 'bg-success/20';
      case 'online': return 'bg-success/20';
      case 'thinking': return 'bg-info/20';
      case 'error': return 'bg-error/20';
      case 'idle': return 'bg-warning/20';
      case 'offline':
      default: return 'bg-neutral-500/20';
    }
  };

  const formatLastActivity = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-black/90 backdrop-blur-md text-white p-6 shadow-2xl border-l border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-4xl">{agent.emoji}</span>
            {agent.name}
          </h2>
          <p className="text-sm text-neutral-400 mt-1">{agent.role}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 ${getStatusBgColor()}`}>
        <div className={`w-2 h-2 rounded-full ${state.status === 'thinking' ? 'animate-pulse' : ''}`} style={{ backgroundColor: agent.color }}></div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {state.status.toUpperCase()}
        </span>
      </div>

      {/* Last Activity */}
      {state.lastActivity && (
        <div className="mb-6 text-sm">
          <span className="text-neutral-400">Last activity: </span>
          <span className="text-white font-medium">{formatLastActivity(state.lastActivity)}</span>
        </div>
      )}

      {/* Current task */}
      {state.currentTask && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-400 mb-2">Current Task</h3>
          <p className="text-base">{state.currentTask}</p>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-neutral-400">Stats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Model */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-neutral-400 mb-1">Model</p>
            <p className="text-lg font-bold capitalize">{state.model || 'N/A'}</p>
          </div>

          {/* Tokens/hour */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-neutral-400 mb-1">Tokens/hour</p>
            <p className="text-lg font-bold">{state.tokensPerHour?.toLocaleString() || '0'}</p>
          </div>

          {/* Tasks in queue */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-neutral-400 mb-1">Queue</p>
            <p className="text-lg font-bold">{state.tasksInQueue || 0} tasks</p>
          </div>

          {/* Uptime */}
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-xs text-neutral-400 mb-1">Uptime</p>
            <p className="text-lg font-bold">{state.uptime || 0} days</p>
          </div>
        </div>
      </div>

      {/* Activity Feed (placeholder) */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-400 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          <div className="bg-white/5 p-3 rounded-lg text-sm">
            <p className="text-neutral-400 text-xs mb-1">2 minutes ago</p>
            <p>Completed task: Generate report</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg text-sm">
            <p className="text-neutral-400 text-xs mb-1">15 minutes ago</p>
            <p>Started: {state.currentTask || 'Processing data'}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg text-sm">
            <p className="text-neutral-400 text-xs mb-1">1 hour ago</p>
            <p>Switched model to {state.model}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-semibold text-neutral-400 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
            Send Message
          </button>
          <button className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
            View History
          </button>
          <button className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
            Change Model
          </button>
          <button className="px-3 py-2 bg-error/20 hover:bg-error/30 rounded-lg text-sm transition-colors text-error">
            Kill Task
          </button>
        </div>
      </div>
    </div>
  );
}

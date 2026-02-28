"use client";

import { useState } from "react";
import {
  RefreshCw,
  Trash2,
  FileText,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface QuickActionsProps {
  onActionComplete?: () => void;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "blue" | "yellow" | "red";
  action: () => Promise<void> | void;
  placeholder?: boolean;
}

export function QuickActions({ onActionComplete }: QuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRestartGateway = async () => {
    // Placeholder - would call openclaw gateway restart
    showNotification("success", "Gateway restart command sent (placeholder)");
  };

  const handleClearActivityLog = async () => {
    setLoadingAction("clear_log");
    try {
      const res = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_activity_log" }),
      });

      if (!res.ok) throw new Error("Failed to clear log");

      showNotification("success", "Activity log cleared successfully");
      onActionComplete?.();
    } catch {
      showNotification("error", "Failed to clear activity log");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewLogs = async () => {
    // Placeholder - would open gateway logs
    showNotification("success", "Opening gateway logs... (placeholder)");
  };

  const actions: ActionButton[] = [
    {
      id: "restart",
      label: "Restart Gateway",
      icon: RefreshCw,
      color: "blue",
      action: handleRestartGateway,
      placeholder: true,
    },
    {
      id: "clear_log",
      label: "Clear Activity Log",
      icon: Trash2,
      color: "yellow",
      action: handleClearActivityLog,
    },
    {
      id: "view_logs",
      label: "View Gateway Logs",
      icon: FileText,
      color: "emerald",
      action: handleViewLogs,
      placeholder: true,
    },
    {
      id: "change_password",
      label: "Change Password",
      icon: Key,
      color: "red",
      action: () => setShowPasswordModal(true),
    },
  ];

  const colorClasses = {
    emerald:
      "bg-success/10 text-success border-success/30 hover:bg-success/20",
    blue: "bg-info/10 text-info border-info/30 hover:bg-info/20",
    yellow:
      "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20",
    red: "bg-error/10 text-error border-error/30 hover:bg-error/20",
  };

  return (
    <>
      <div className="bg-neutral-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-success" />
          Quick Actions
        </h2>

        {/* Notification */}
        {notification && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              notification.type === "success"
                ? "bg-success/10 text-success border border-success/30"
                : "bg-error/10 text-error border border-error/30"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.id;

            return (
              <button
                key={action.id}
                onClick={() => action.action()}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  colorClasses[action.color]
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="font-medium">{action.label}</span>
                {action.placeholder && (
                  <span className="text-xs opacity-50">(placeholder)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          showNotification("success", "Password changed successfully");
          setShowPasswordModal(false);
        }}
      />
    </>
  );
}

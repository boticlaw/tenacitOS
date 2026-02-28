/**
 * Notification Operations Layer
 * Pure functions for notification management with validation and error handling
 */

import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

// Types
export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationPriority = "low" | "medium" | "high";

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateNotificationInput {
  id: string;
  read?: boolean;
}

export interface MarkAllReadInput {
  // No fields needed - marks all as read
}

export interface DeleteNotificationInput {
  id: string;
}

export interface ClearReadInput {
  // No fields needed - deletes all read notifications
}

export interface ListNotificationsInput {
  onlyUnread?: boolean;
  limit?: number;
  type?: NotificationType;
}

export interface NotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// Validation
const VALID_TYPES: NotificationType[] = ["info", "success", "warning", "error"];
const VALID_PRIORITIES: NotificationPriority[] = ["low", "medium", "high"];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNotificationType(type: string): ValidationResult {
  const errors: string[] = [];

  if (!type) {
    errors.push("Notification type is required");
  } else if (!VALID_TYPES.includes(type as NotificationType)) {
    errors.push(`Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateNotificationPriority(priority: string): ValidationResult {
  const errors: string[] = [];

  if (priority && !VALID_PRIORITIES.includes(priority as NotificationPriority)) {
    errors.push(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateCreateNotification(input: CreateNotificationInput): ValidationResult {
  const errors: string[] = [];

  if (!input.title?.trim()) {
    errors.push("Title is required");
  } else if (input.title.length > 200) {
    errors.push("Title must be less than 200 characters");
  }

  if (!input.message?.trim()) {
    errors.push("Message is required");
  } else if (input.message.length > 2000) {
    errors.push("Message must be less than 2000 characters");
  }

  if (input.type) {
    const typeResult = validateNotificationType(input.type);
    errors.push(...typeResult.errors);
  }

  if (input.priority) {
    const priorityResult = validateNotificationPriority(input.priority);
    errors.push(...priorityResult.errors);
  }

  if (input.link && !isValidUrl(input.link)) {
    errors.push("Invalid link URL");
  }

  return { valid: errors.length === 0, errors };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Data storage helper
const DATA_PATH = path.join(process.cwd(), "data", "notifications.json");

async function loadNotifications(): Promise<Notification[]> {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveNotifications(notifications: Notification[]): Promise<void> {
  const dir = path.dirname(DATA_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(DATA_PATH, JSON.stringify(notifications, null, 2));
}

// Operations
export async function listNotifications(
  input: ListNotificationsInput = {}
): Promise<{ success: boolean; data?: NotificationsResult; error?: string }> {
  try {
    let notifications = await loadNotifications();

    // Filter by read status
    if (input.onlyUnread) {
      notifications = notifications.filter((n) => !n.read);
    }

    // Filter by type
    if (input.type) {
      notifications = notifications.filter((n) => n.type === input.type);
    }

    // Sort by timestamp (newest first)
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const allNotifications = await loadNotifications();
    const unreadCount = allNotifications.filter((n) => !n.read).length;

    // Apply limit
    const limit = input.limit ?? 50;
    notifications = notifications.slice(0, limit);

    return {
      success: true,
      data: {
        notifications,
        total: allNotifications.length,
        unreadCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list notifications",
    };
  }
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<{ success: boolean; data?: Notification; error?: string }> {
  // Validate
  const validation = validateCreateNotification(input);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  try {
    const notifications = await loadNotifications();

    const newNotification: Notification = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      title: input.title,
      message: input.message,
      type: input.type || "info",
      priority: input.priority,
      read: false,
      link: input.link,
      metadata: input.metadata,
    };

    // Prepend (newest first)
    notifications.unshift(newNotification);

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100);
    }

    await saveNotifications(notifications);

    return { success: true, data: newNotification };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    };
  }
}

export async function updateNotification(
  input: UpdateNotificationInput
): Promise<{ success: boolean; data?: Notification; error?: string }> {
  if (!input.id) {
    return { success: false, error: "Notification ID is required" };
  }

  try {
    const notifications = await loadNotifications();
    const notification = notifications.find((n) => n.id === input.id);

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    if (input.read !== undefined) {
      notification.read = input.read;
    }

    await saveNotifications(notifications);
    return { success: true, data: notification };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notification",
    };
  }
}

export async function markAllRead(
  _input?: MarkAllReadInput
): Promise<{ success: boolean; data?: { updated: number }; error?: string }> {
  try {
    const notifications = await loadNotifications();
    let updated = 0;

    notifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        updated++;
      }
    });

    await saveNotifications(notifications);
    return { success: true, data: { updated } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark all as read",
    };
  }
}

export async function deleteNotification(
  input: DeleteNotificationInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.id) {
    return { success: false, error: "Notification ID is required" };
  }

  try {
    const notifications = await loadNotifications();
    const index = notifications.findIndex((n) => n.id === input.id);

    if (index === -1) {
      return { success: false, error: "Notification not found" };
    }

    notifications.splice(index, 1);
    await saveNotifications(notifications);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete notification",
    };
  }
}

export async function clearRead(
  _input?: ClearReadInput
): Promise<{ success: boolean; data?: { deleted: number }; error?: string }> {
  try {
    const notifications = await loadNotifications();
    const originalLength = notifications.length;
    const updated = notifications.filter((n) => !n.read);

    await saveNotifications(updated);

    return { success: true, data: { deleted: originalLength - updated.length } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear read notifications",
    };
  }
}

// Helper to get unread count without loading all data
export async function getUnreadCount(): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const notifications = await loadNotifications();
    const count = notifications.filter((n) => !n.read).length;
    return { success: true, data: count };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unread count",
    };
  }
}

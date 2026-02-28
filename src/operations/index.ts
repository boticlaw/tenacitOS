/**
 * Operations Layer - Index
 * Re-exports all operations for convenient importing
 */

// Activity operations
export {
  // Types
  type Activity,
  type ActivityType,
  type ActivityStatus,
  type CreateActivityInput,
  type UpdateActivityInput,
  type ApproveActivityInput,
  type GetActivitiesInput,
  type ActivitiesResult,
  // Validation
  validateActivityType,
  validateActivityStatus,
  validateCreateActivity,
  // Operations
  createActivity,
  updateActivity,
  approveActivity,
  getActivities,
  getActivityStats,
  ACTIVITY_TYPE_ALIASES,
} from "./activity-operations";

// Session operations
export {
  // Types
  type Session,
  type SessionType,
  type SessionMessage,
  type SessionWithMessages,
  type ListSessionsInput,
  type GetSessionInput,
  type ChangeModelInput,
  type ArchiveSessionInput,
  // Validation
  validateSessionId,
  validateModel,
  validateSessionKey,
  // Operations
  listSessions,
  getSession,
  changeModel,
  archiveSession,
} from "./session-operations";

// Notification operations
export {
  // Types
  type Notification,
  type NotificationType,
  type NotificationPriority,
  type CreateNotificationInput,
  type UpdateNotificationInput,
  type MarkAllReadInput,
  type DeleteNotificationInput,
  type ClearReadInput,
  type ListNotificationsInput,
  type NotificationsResult,
  // Validation
  validateNotificationType,
  validateNotificationPriority,
  validateCreateNotification,
  // Operations
  listNotifications,
  createNotification,
  updateNotification,
  markAllRead,
  deleteNotification,
  clearRead,
  getUnreadCount,
} from "./notification-operations";

// Cron operations
export {
  // Types
  type CronJob,
  type CreateCronJobInput,
  type UpdateCronJobInput,
  type RunCronJobInput,
  type DeleteCronJobInput,
  type ListCronJobsInput,
  // Validation
  validateJobName,
  validateCronExpression,
  validateCreateCronJob,
  validateJobId,
  // Operations
  listCronJobs,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  runCronJob,
} from "./cron-operations";

// Common types
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Operations Layer - Business logic separated from UI
 * 
 * This module provides reusable operation functions that encapsulate
 * business logic, making it easier to test, reuse, and maintain.
 * 
 * Usage:
 *   import { approveActivity, pauseAgent, createSession } from '@/operations';
 */

// Re-export all operations
export * from './activity-ops';
export * from './agent-ops';
export * from './cron-ops';
export * from './session-ops';
export * from './notification-ops';

// Common result type for operations
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// Pagination helpers
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function paginate<T>(
  items: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);

  return {
    items: paginatedItems,
    total: items.length,
    page,
    limit,
    hasMore: end < items.length,
  };
}

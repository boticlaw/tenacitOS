/**
 * Activity Operations - Business logic for activity management
 */
import { getActivities, addActivity, updateActivityStatus, type Activity } from '@/lib/activities-db';
import type { OperationResult, PaginationParams, PaginatedResult } from './index';

export interface ActivityFilters {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Fetch activities with filtering and pagination
 */
export async function fetchActivities(
  filters: ActivityFilters = {},
  pagination: PaginationParams = {}
): Promise<OperationResult<PaginatedResult<Activity>>> {
  try {
    const result = getActivities({
      limit: 1000, // Get all then filter in memory for now
      sort: 'newest',
    });

    let filtered = result.activities;

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(a => new Date(a.timestamp) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      filtered = filtered.filter(a => new Date(a.timestamp) <= end);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(a => 
        a.description.toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const start = (page - 1) * limit;
    const paginatedItems = filtered.slice(start, start + limit);

    return {
      success: true,
      data: {
        items: paginatedItems,
        total: filtered.length,
        page,
        limit,
        hasMore: start + limit < filtered.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch activities',
    };
  }
}

/**
 * Get a single activity by ID
 */
export async function getActivityById(id: string): Promise<OperationResult<Activity>> {
  try {
    const result = getActivities({ limit: 1000 });
    const activity = result.activities.find(a => a.id === id);

    if (!activity) {
      return { success: false, error: 'Activity not found' };
    }

    return { success: true, data: activity };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get activity',
    };
  }
}

/**
 * Create a new activity
 */
export async function createActivity(
  type: string,
  description: string,
  metadata: Partial<Activity> = {}
): Promise<OperationResult<Activity>> {
  try {
    const activity = addActivity({
      type,
      description,
      status: metadata.status || 'success',
      duration: metadata.duration,
      tokens_used: metadata.tokens_used,
      ...metadata,
    });

    return { success: true, data: activity };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create activity',
    };
  }
}

/**
 * Approve a pending activity
 */
export async function approveActivity(
  id: string,
  notes?: string
): Promise<OperationResult> {
  try {
    const existing = await getActivityById(id);
    if (!existing.success || !existing.data) {
      return { success: false, error: 'Activity not found' };
    }

    if (existing.data.status !== 'pending') {
      return { 
        success: false, 
        error: 'Only pending activities can be approved' 
      };
    }

    updateActivityStatus(id, 'approved');
    
    // Log the approval
    addActivity({
      type: 'approval',
      description: `Activity ${id} approved${notes ? `: ${notes}` : ''}`,
      status: 'success',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve activity',
    };
  }
}

/**
 * Reject a pending activity
 */
export async function rejectActivity(
  id: string,
  reason?: string
): Promise<OperationResult> {
  try {
    const existing = await getActivityById(id);
    if (!existing.success || !existing.data) {
      return { success: false, error: 'Activity not found' };
    }

    if (existing.data.status !== 'pending') {
      return { 
        success: false, 
        error: 'Only pending activities can be rejected' 
      };
    }

    updateActivityStatus(id, 'rejected');
    
    // Log the rejection
    addActivity({
      type: 'rejection',
      description: `Activity ${id} rejected${reason ? `: ${reason}` : ''}`,
      status: 'success',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject activity',
    };
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(
  days: number = 7
): Promise<OperationResult<{
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  successRate: number;
  avgDuration: number;
}>> {
  try {
    const result = getActivities({ limit: 1000, sort: 'newest' });
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recent = result.activities.filter(
      a => new Date(a.timestamp) >= cutoff
    );

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let successCount = 0;

    for (const activity of recent) {
      byStatus[activity.status] = (byStatus[activity.status] || 0) + 1;
      byType[activity.type] = (byType[activity.type] || 0) + 1;
      
      if (activity.duration) {
        totalDuration += activity.duration;
        durationCount++;
      }
      
      if (activity.status === 'success' || activity.status === 'approved') {
        successCount++;
      }
    }

    return {
      success: true,
      data: {
        total: recent.length,
        byStatus,
        byType,
        successRate: recent.length > 0 ? (successCount / recent.length) * 100 : 0,
        avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}

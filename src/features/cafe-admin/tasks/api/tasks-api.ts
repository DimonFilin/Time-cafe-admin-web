import { TaskAssignmentType } from '../types/tasks.types';
import type {
  TaskTemplate,
  CreateTaskTemplateDto,
  UpdateTaskTemplateDto,
  TaskStatistics,
  TaskCompletionsResponse,
} from '../types/tasks.types';

export async function getTaskTemplates(params?: {
  includeInactive?: boolean;
}): Promise<TaskTemplate[]> {
  const searchParams = new URLSearchParams();
  if (params?.includeInactive) {
    searchParams.set('includeInactive', 'true');
  }

  const response = await fetch(`/api/cafe-admin/tasks/templates?${searchParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch task templates');
  }

  return response.json();
}

export async function createTaskTemplate(data: CreateTaskTemplateDto): Promise<TaskTemplate> {
  // Clean up the data - remove empty strings and ensure booleans are sent correctly
  const cleanData: Record<string, unknown> = {
    title: data.title.trim(),
    category: data.category,
    priority: data.priority,
    assignmentType: data.assignmentType,
  };

  // Only add description if it's not empty
  if (data.description && data.description.trim()) {
    cleanData.description = data.description.trim();
  }

  // Only add estimatedMinutes if it's set
  if (data.estimatedMinutes) {
    cleanData.estimatedMinutes = data.estimatedMinutes;
  }

  // Always send boolean values explicitly
  if (data.requiresPhoto) {
    cleanData.requiresPhoto = true;
  }
  if (data.requiresComment) {
    cleanData.requiresComment = true;
  }

  // Add optional arrays if present
  if (
    data.assignmentType === TaskAssignmentType.SPECIFIC_WORKERS &&
    data.assignedWorkerIds &&
    data.assignedWorkerIds.length > 0
  ) {
    cleanData.assignedWorkerIds = data.assignedWorkerIds;
  }
  if (
    data.assignmentType === TaskAssignmentType.ROLE_BASED &&
    data.assignedRoles &&
    data.assignedRoles.length > 0
  ) {
    cleanData.assignedRoles = data.assignedRoles;
  }
  if (data.daysOfWeek && data.daysOfWeek.length > 0) {
    cleanData.daysOfWeek = data.daysOfWeek;
  }

  console.log('[createTaskTemplate] Sending data:', cleanData);

  const response = await fetch('/api/cafe-admin/tasks/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanData),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[createTaskTemplate] Error response:', error);

    // Extract error message from array if present
    const errorMessage = Array.isArray(error.message)
      ? error.message.join(', ')
      : error.message || 'Failed to create task template';

    throw new Error(errorMessage);
  }

  return response.json();
}

export async function updateTaskTemplate(
  id: string,
  data: UpdateTaskTemplateDto,
): Promise<TaskTemplate> {
  const response = await fetch(`/api/cafe-admin/tasks/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update task template');
  }

  return response.json();
}

export async function deactivateTaskTemplate(id: string): Promise<TaskTemplate> {
  const response = await fetch(`/api/cafe-admin/tasks/templates/${id}/deactivate`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to deactivate task template');
  }

  return response.json();
}

export async function getTaskStatistics(params: {
  fromDate: string;
  toDate: string;
}): Promise<TaskStatistics> {
  const searchParams = new URLSearchParams();
  searchParams.set('fromDate', params.fromDate);
  searchParams.set('toDate', params.toDate);

  const response = await fetch(`/api/cafe-admin/tasks/statistics?${searchParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch task statistics');
  }

  return response.json();
}

export async function getTaskCompletions(params: {
  templateId: string;
  fromDate: string;
  toDate: string;
  page?: number;
  pageSize?: number;
}): Promise<TaskCompletionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('fromDate', params.fromDate);
  searchParams.set('toDate', params.toDate);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const response = await fetch(
    `/api/cafe-admin/tasks/templates/${params.templateId}/completions?${searchParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch task completions');
  }

  return response.json();
}

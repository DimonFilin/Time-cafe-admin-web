import type { WorkerTasksResponse, CompleteTaskDto } from '../types/tasks.types';

const API_BASE = '/api/cafe-worker/tasks';

/**
 * Get worker tasks for a specific date
 */
export async function getWorkerTasks(date?: string): Promise<WorkerTasksResponse> {
  const url = date ? `${API_BASE}?date=${date}` : API_BASE;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch tasks' }));
    throw new Error(error.message || 'Failed to fetch tasks');
  }

  return response.json();
}

/**
 * Mark task as completed
 */
export async function completeTask(
  templateId: string,
  data: CompleteTaskDto,
): Promise<{ completed: boolean }> {
  const response = await fetch(`${API_BASE}/${templateId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to complete task' }));
    throw new Error(error.message || 'Failed to complete task');
  }

  return response.json();
}

/**
 * Unmark task completion
 */
export async function uncompleteTask(
  templateId: string,
  date: string,
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/${templateId}/complete?date=${date}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to uncomplete task' }));
    throw new Error(error.message || 'Failed to uncomplete task');
  }

  return response.json();
}

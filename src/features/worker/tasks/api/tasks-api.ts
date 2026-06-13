import type { WorkerTasksResponse, CompleteTaskDto } from '../types/tasks.types';
import { t } from '@/i18n';

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
    const error = await response.json().catch(() => ({ message: t('apiErrors.fetchTasks') }));
    throw new Error(error.message || t('apiErrors.fetchTasks'));
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
    const error = await response.json().catch(() => ({ message: t('apiErrors.completeTask') }));
    throw new Error(error.message || t('apiErrors.completeTask'));
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
    const error = await response.json().catch(() => ({ message: t('apiErrors.uncompleteTask') }));
    throw new Error(error.message || t('apiErrors.uncompleteTask'));
  }

  return response.json();
}

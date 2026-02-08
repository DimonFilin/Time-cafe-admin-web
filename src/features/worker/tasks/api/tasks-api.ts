import type { WorkerTasksResponse, CompleteTaskRequest } from '../types/tasks.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const tasksApi = {
  /**
   * Get tasks for worker on specific date
   */
  async getWorkerTasks(date?: string): Promise<WorkerTasksResponse> {
    const params = new URLSearchParams();
    if (date) {
      params.append('date', date);
    }

    const url = `/api/cafe-worker/tasks${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch tasks' }));
      throw new Error(error.message || 'Failed to fetch tasks');
    }

    return response.json();
  },

  /**
   * Mark task as completed
   */
  async completeTask(
    templateId: string,
    data: CompleteTaskRequest,
  ): Promise<{ completed: boolean }> {
    const response = await fetch(`/api/cafe-worker/tasks/${templateId}/complete`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to complete task' }));
      throw new Error(error.message || 'Failed to complete task');
    }

    return response.json();
  },

  /**
   * Unmark task completion
   */
  async uncompleteTask(templateId: string, date: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({ date });

    const response = await fetch(
      `/api/cafe-worker/tasks/${templateId}/complete?${params.toString()}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to uncomplete task' }));
      throw new Error(error.message || 'Failed to uncomplete task');
    }

    return response.json();
  },
};

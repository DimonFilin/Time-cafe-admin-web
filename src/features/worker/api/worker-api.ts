import { clientFetch } from '@/shared/lib/client-fetch';
import type { WorkerMeSchedule, WorkerWithRelations } from '../types/worker.types';

export type ToggleShiftError = Error & { requireConfirm?: boolean };

export const workerApi = {
  async getMe(): Promise<WorkerWithRelations> {
    return clientFetch<WorkerWithRelations>('/api/cafe-worker/me');
  },

  async getMySchedule(): Promise<WorkerMeSchedule> {
    return clientFetch<WorkerMeSchedule>('/api/cafe-worker/me/schedule');
  },

  async updateProfile(body: {
    firstName?: string;
    lastName?: string;
    birthDate?: string | null;
    avatar?: string | null;
  }): Promise<WorkerWithRelations> {
    return clientFetch<WorkerWithRelations>('/api/cafe-worker/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  async uploadAvatar(file: File): Promise<WorkerWithRelations> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/cafe-worker/me/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json() as Promise<WorkerWithRelations>;
  },

  async toggleShiftStatus(options?: { confirmOutsideSchedule?: boolean }): Promise<void> {
    const res = await fetch('/api/cafe-worker/shift-status', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmOutsideSchedule: options?.confirmOutsideSchedule ?? false,
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        message?: string;
        requireConfirm?: boolean;
      };
      const msg = typeof err.message === 'string' ? err.message : `HTTP ${res.status}`;
      const e = new Error(msg) as ToggleShiftError;
      if (err.requireConfirm) e.requireConfirm = true;
      throw e;
    }
  },
};

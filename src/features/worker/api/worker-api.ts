import { clientFetch } from '@/shared/lib/client-fetch';
import type { WorkerWithRelations } from '../types/worker.types';

export const workerApi = {
  // Получить информацию о текущем работнике
  async getMe(): Promise<WorkerWithRelations> {
    return clientFetch<WorkerWithRelations>('/api/cafe-worker/me');
  },

  // Переключить статус смены
  async toggleShiftStatus(): Promise<void> {
    await clientFetch('/api/cafe-worker/shift-status', {
      method: 'PATCH',
    });
  },
};

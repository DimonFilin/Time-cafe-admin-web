import type { CreateActivityLogDto } from '@/features/brand-admin/activity-logs/api/activity-logs-api';

/**
 * Тонкий beacon к POST /api/activity-logs (прокси на бэкенд). Ошибки глушим — аудит не должен ломать UI.
 */
export function logWorkerActivity(payload: CreateActivityLogDto): void {
  if (typeof window === 'undefined') return;
  void fetch('/api/activity-logs', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

import { t } from '@/i18n';

export type WorkerRoleKey = 'SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER';

export function workerRoleLabel(role: WorkerRoleKey | string): string {
  switch (role) {
    case 'SYSTEM_ADMIN':
      return t('workers.roles.systemAdmin');
    case 'BRAND_ADMIN':
      return t('workers.roles.brandAdmin');
    case 'CAFE_ADMIN':
      return t('workers.roles.cafeAdmin');
    case 'WORKER':
      return t('workers.roles.worker');
    default:
      return role;
  }
}

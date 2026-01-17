import type { AccountRole } from '@/shared/types/worker-role';

export type MeResponse = {
  id: string;
  email: string;
  role: AccountRole;
  brandId?: string | null;
  cafeId?: string | null;
  [key: string]: unknown;
};

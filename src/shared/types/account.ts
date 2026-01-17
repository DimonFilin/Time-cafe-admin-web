import type { AccountRole } from '@/shared/types/worker-role';

export type AccountSummary = {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
  brandId?: string | null;
  cafeId?: string | null;
};

export type AccountDetails = AccountSummary & {
  createdAt: string;
};

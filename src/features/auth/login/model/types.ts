import type { AccountSummary } from '@/shared/types/account';

export type LoginStep = 'email' | 'password' | 'chooseAccount' | 'done';

export type LoginLookupResult = {
  accounts: AccountSummary[];
  lookupToken: string;
};

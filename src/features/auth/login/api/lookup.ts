import type { LoginLookupResult } from '@/features/auth/login/model/types';

export async function lookupAccounts(input: { email: string; password: string }) {
  const res = await fetch('/api/auth/lookup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    try {
      const errorData = await res.json().catch(() => null);
      const message = errorData?.message || `Ошибка входа: ${res.status}`;
      throw new Error(message);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`Ошибка входа: ${res.status}`);
    }
  }

  return (await res.json()) as LoginLookupResult;
}

import type { LoginLookupResult } from '@/features/auth/login/model/types';

export async function lookupAccounts(input: { email: string; password: string }) {
  const res = await fetch('/api/auth/lookup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Lookup failed: ${res.status}`);
  }

  return (await res.json()) as LoginLookupResult;
}

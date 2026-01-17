import type { MeResponse } from '@/shared/types/me';

export async function fetchMe() {
  const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Me failed: ${res.status}`);
  }
  return (await res.json()) as MeResponse;
}

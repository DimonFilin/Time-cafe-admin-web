import type { MeResponse } from '@/shared/types/me';

export async function fetchMe() {
  const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
  if (!res.ok) {
    try {
      const errorData = await res.json().catch(() => null);
      const message = errorData?.message || `Ошибка получения профиля: ${res.status}`;
      throw new Error(message);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`Ошибка получения профиля: ${res.status}`);
    }
  }
  return (await res.json()) as MeResponse;
}

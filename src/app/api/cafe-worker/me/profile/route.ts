import { NextRequest } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/cafe-worker/me/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body || '{}',
    cache: 'no-store',
  });
}

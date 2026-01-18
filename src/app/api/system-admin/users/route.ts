import { NextRequest } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(req: NextRequest) {
  console.log('[users-route] GET /api/system-admin/users called');
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const url = `${env.backendUrl}/admin/users${query ? `?${query}` : ''}`;
  console.log('[users-route] Backend URL:', url);

  const response = await fetchWithAuthRefresh(url, {
    method: 'GET',
    cache: 'no-store',
  });

  console.log('[users-route] Response status:', response.status);
  return response;
}

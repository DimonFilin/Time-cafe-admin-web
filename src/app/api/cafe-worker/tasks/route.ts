import { NextRequest } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  const url = new URL(`${env.backendUrl}/cafe-worker/tasks`);
  if (date) {
    url.searchParams.append('date', date);
  }

  return fetchWithAuthRefresh(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  });
}

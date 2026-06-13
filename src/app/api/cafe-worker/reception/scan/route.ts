import { NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  return fetchWithAuthRefresh(`${env.backendUrl}/worker/reception/scan?${query}`, {
    method: 'GET',
    cache: 'no-store',
  });
}

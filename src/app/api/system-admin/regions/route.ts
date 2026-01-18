import { NextRequest } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const url = `${env.backendUrl}/regions${query ? `?${query}` : ''}`;

  return fetchWithAuthRefresh(url, {
    method: 'GET',
    cache: 'no-store',
  });
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  const url = `${env.backendUrl}/regions`;

  return fetchWithAuthRefresh(url, {
    method: 'POST',
    body: bodyText,
    cache: 'no-store',
  });
}

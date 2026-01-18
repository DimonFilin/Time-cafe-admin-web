import { NextRequest } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(req: NextRequest, ctx: { params: Promise<{ cafeId: string }> }) {
  const { cafeId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const url = `${env.backendUrl}/orders/cafe/${cafeId}${query ? `?${query}` : ''}`;

  return fetchWithAuthRefresh(url, {
    method: 'GET',
    cache: 'no-store',
  });
}

import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(_req: Request, ctx: { params: Promise<{ cafeId: string; id: string }> }) {
  const { cafeId, id } = await ctx.params;
  const url = `${env.backendUrl}/orders/cafe/${cafeId}/${id}`;

  return fetchWithAuthRefresh(url, {
    method: 'GET',
    cache: 'no-store',
  });
}

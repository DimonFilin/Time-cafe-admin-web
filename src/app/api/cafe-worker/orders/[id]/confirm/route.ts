import { NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const query = req.nextUrl.searchParams.toString();
  const url = `${env.backendUrl}/cafe-worker/orders/${id}/confirm${query ? `?${query}` : ''}`;

  return fetchWithAuthRefresh(url, {
    method: 'PATCH',
    cache: 'no-store',
  });
}

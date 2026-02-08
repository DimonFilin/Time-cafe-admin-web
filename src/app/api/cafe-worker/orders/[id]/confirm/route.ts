import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = `${env.backendUrl}/cafe-worker/orders/${id}/confirm`;

  return fetchWithAuthRefresh(url, {
    method: 'PATCH',
    cache: 'no-store',
  });
}

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bodyText = await req.text();
  const url = `${env.backendUrl}/cafe-worker/orders/${id}/cancel`;

  return fetchWithAuthRefresh(url, {
    method: 'PATCH',
    body: bodyText,
    cache: 'no-store',
  });
}

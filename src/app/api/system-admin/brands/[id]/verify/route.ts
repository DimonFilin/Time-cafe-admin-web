import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = `${env.backendUrl}/brands/${id}/verify`;

  return fetchWithAuthRefresh(url, {
    method: 'POST',
    cache: 'no-store',
  });
}

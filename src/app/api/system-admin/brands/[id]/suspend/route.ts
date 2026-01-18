import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bodyText = await req.text();
  const url = `${env.backendUrl}/brands/${id}/suspend`;

  return fetchWithAuthRefresh(url, {
    method: 'POST',
    body: bodyText,
    cache: 'no-store',
  });
}

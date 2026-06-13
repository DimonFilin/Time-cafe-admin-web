import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/loyalty/tiers/${id}/deactivate`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
}

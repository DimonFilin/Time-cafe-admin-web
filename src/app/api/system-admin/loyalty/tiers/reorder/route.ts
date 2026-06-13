import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PUT(req: Request) {
  const body = await req.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/loyalty/tiers/reorder`, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
}

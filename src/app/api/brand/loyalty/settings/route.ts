import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET() {
  return fetchWithAuthRefresh(`${env.backendUrl}/brands/my/loyalty/settings`, {
    method: 'GET',
    cache: 'no-store',
  });
}

export async function PATCH(req: Request) {
  const body = await req.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/brands/my/loyalty/settings`, {
    method: 'PATCH',
    body,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
}

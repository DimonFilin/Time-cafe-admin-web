import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET() {
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/guests`, {
    method: 'GET',
    cache: 'no-store',
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/guests`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
}

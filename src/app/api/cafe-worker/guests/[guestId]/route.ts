import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(_req: Request, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/guests/${guestId}`, {
    method: 'GET',
    cache: 'no-store',
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const body = await req.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/guests/${guestId}`, {
    method: 'PATCH',
    body,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
}

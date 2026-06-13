import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(req: Request, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const body = await req.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/worker/guests/${guestId}/tier`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });
}

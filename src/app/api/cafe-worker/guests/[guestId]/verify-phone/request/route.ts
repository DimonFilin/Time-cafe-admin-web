import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(_req: Request, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/guests/${guestId}/verify-phone/request`, {
    method: 'POST',
    cache: 'no-store',
  });
}

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(_req: Request, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  return fetchWithAuthRefresh(`${env.backendUrl}/worker/guests/${guestId}/tier-history`, {
    cache: 'no-store',
  });
}

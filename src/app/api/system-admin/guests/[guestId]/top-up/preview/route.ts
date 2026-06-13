import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(req: Request, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const body = await req.text();
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/guests/${guestId}/top-up/preview`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
}

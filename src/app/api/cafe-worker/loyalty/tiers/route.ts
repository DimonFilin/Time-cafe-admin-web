import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET() {
  return fetchWithAuthRefresh(`${env.backendUrl}/worker/loyalty/tiers`, {
    cache: 'no-store',
  });
}

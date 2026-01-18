import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function GET() {
  return fetchWithAuthRefresh(`${env.backendUrl}/admin/storage/buckets`, {
    method: 'GET',
  });
}

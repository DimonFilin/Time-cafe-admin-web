import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ cafeId: string; appointmentId: string }> },
) {
  const { cafeId, appointmentId } = await ctx.params;
  const url = `${env.backendUrl}/appointments/cafe/${cafeId}/${appointmentId}`;

  return fetchWithAuthRefresh(url, {
    method: 'GET',
    cache: 'no-store',
  });
}

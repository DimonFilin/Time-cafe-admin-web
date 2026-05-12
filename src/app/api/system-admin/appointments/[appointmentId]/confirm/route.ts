import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(_req: Request, ctx: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await ctx.params;
  const url = `${env.backendUrl}/appointments/cafe/${appointmentId}/confirm`;

  return fetchWithAuthRefresh(url, {
    method: 'POST',
    cache: 'no-store',
  });
}

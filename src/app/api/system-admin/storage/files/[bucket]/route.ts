import { NextRequest } from 'next/server';

import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function GET(req: NextRequest, ctx: { params: Promise<{ bucket: string }> }) {
  const { bucket } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix');
  const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';

  return fetchWithAuthRefresh(`${env.backendUrl}/admin/storage/files/${bucket}${query}`, {
    method: 'GET',
  });
}

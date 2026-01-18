import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bodyText = await req.text();
  const url = `${env.backendUrl}/admin/workers/${id}`;

  return fetchWithAuthRefresh(url, {
    method: 'PATCH',
    body: bodyText,
    cache: 'no-store',
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = `${env.backendUrl}/admin/workers/${id}`;

  return fetchWithAuthRefresh(url, {
    method: 'DELETE',
    cache: 'no-store',
  });
}

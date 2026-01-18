import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = `${env.backendUrl}/admin/users/${id}`;

  return fetchWithAuthRefresh(url, {
    method: 'GET',
    cache: 'no-store',
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bodyText = await req.text();
  const url = `${env.backendUrl}/admin/users/${id}`;

  return fetchWithAuthRefresh(url, {
    method: 'PATCH',
    body: bodyText,
    cache: 'no-store',
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = `${env.backendUrl}/admin/users/${id}`;

  const response = await fetchWithAuthRefresh(url, {
    method: 'DELETE',
    cache: 'no-store',
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return response;
}

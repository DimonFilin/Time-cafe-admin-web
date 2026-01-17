import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/shared/config/env';

async function getAccessToken() {
  const store = await cookies();
  return store.get('tc_access')?.value ?? null;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await getAccessToken();
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const page = url.searchParams.get('page') ?? '1';
  const limit = url.searchParams.get('limit') ?? '20';

  const res = await fetch(
    `${env.backendUrl}/admin/workers?brandId=${encodeURIComponent(id)}&page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
    {
      cache: 'no-store',
      headers: { authorization: `Bearer ${access}` },
    },
  );

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

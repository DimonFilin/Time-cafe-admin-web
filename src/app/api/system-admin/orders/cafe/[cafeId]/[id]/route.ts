import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/shared/config/env';

async function getAccessToken() {
  const store = await cookies();
  return store.get('tc_access')?.value ?? null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ cafeId: string; id: string }> }) {
  const access = await getAccessToken();
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { cafeId, id } = await ctx.params;
  const res = await fetch(`${env.backendUrl}/orders/cafe/${cafeId}/${id}`, {
    cache: 'no-store',
    headers: { authorization: `Bearer ${access}` },
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

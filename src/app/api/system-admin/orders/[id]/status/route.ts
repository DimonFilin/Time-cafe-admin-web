import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/shared/config/env';

async function getAccessToken() {
  const store = await cookies();
  return store.get('tc_access')?.value ?? null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await getAccessToken();
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const bodyText = await req.text();
  const res = await fetch(`${env.backendUrl}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${access}` },
    body: bodyText,
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

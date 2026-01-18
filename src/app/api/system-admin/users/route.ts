import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/shared/config/env';

async function getAccessToken() {
  const store = await cookies();
  return store.get('tc_access')?.value ?? null;
}

export async function GET(req: NextRequest) {
  const access = await getAccessToken();
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const url = `${env.backendUrl}/admin/users${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${access}` },
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET() {
  const res = await fetch(`${env.backendUrl}/brands`, { cache: 'no-store' });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  const url = `${env.backendUrl}/brands`;

  return fetchWithAuthRefresh(url, {
    method: 'POST',
    body: bodyText,
    cache: 'no-store',
  });
}

import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const backendUrl = `${env.backendUrl}/reviews${qs ? `?${qs}` : ''}`;

  const res = await fetch(backendUrl, { cache: 'no-store' });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

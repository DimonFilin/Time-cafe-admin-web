import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';

export async function POST(req: Request) {
  const bodyText = await req.text();
  const res = await fetch(`${env.backendUrl}/cafes/geocode`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: bodyText,
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

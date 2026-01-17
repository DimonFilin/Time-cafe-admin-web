import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/shared/config/env';

async function getAccessToken() {
  const store = await cookies();
  return store.get('tc_access')?.value ?? null;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const page = url.searchParams.get('page') ?? '1';
  const limit = url.searchParams.get('limit') ?? '20';

  const res = await fetch(
    `${env.backendUrl}/cafes?brandId=${encodeURIComponent(id)}&page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
    {
      cache: 'no-store',
    },
  );

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await getAccessToken();
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const bodyText = await req.text();

  // Ensure brandId is correct even if caller sends something else.
  const body = (() => {
    try {
      return JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      return {};
    }
  })();
  body.brandId = id;

  const res = await fetch(`${env.backendUrl}/cafes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${access}` },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/shared/config/env';

async function getAccessToken() {
  const store = await cookies();
  return store.get('tc_access')?.value ?? null;
}

export async function GET(req: Request) {
  const access = await getAccessToken();
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const backendUrl = `${env.backendUrl}/admin/workers${qs ? `?${qs}` : ''}`;

  const res = await fetch(backendUrl, {
    cache: 'no-store',
    headers: { authorization: `Bearer ${access}` },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

// Register worker (SYSTEM_ADMIN)
export async function POST(req: Request) {
  const access = await getAccessToken();
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const bodyText = await req.text();
  const res = await fetch(`${env.backendUrl}/auth/workers`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${access}` },
    body: bodyText,
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) {
    return new NextResponse(text, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  }

  // Backend returns tokens for the newly created worker — do not expose them to browser.
  try {
    const payload = JSON.parse(text) as { user?: unknown };
    return NextResponse.json({ user: payload.user }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Worker created' }, { status: 201 });
  }
}

import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';

type LookupRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LookupRequestBody;
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';

  if (!email) {
    return NextResponse.json({ message: 'email is required' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ message: 'password is required' }, { status: 400 });
  }

  const res = await fetch(`${env.backendUrl}/auth/login/lookup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

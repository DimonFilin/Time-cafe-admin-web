import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const access = cookieStore.get('tc_access')?.value;
  const accountId = cookieStore.get('tc_account_id')?.value;
  if (!access) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!accountId) {
    return NextResponse.json(
      {
        message:
          'Account not selected on frontend. Call /api/auth/select first (tc_account_id missing).',
      },
      { status: 401 },
    );
  }

  // Forward cookies from the browser request to backend.
  // This is more reliable than manually crafting a Cookie header.
  const incomingCookieHeader = req.headers.get('cookie') ?? '';

  const res = await fetch(`${env.backendUrl}/auth/me`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${access}`,
      cookie: incomingCookieHeader,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

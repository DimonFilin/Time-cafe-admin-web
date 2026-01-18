import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { handleBackendError, processBackendResponse } from '@/shared/lib/handle-backend-error';

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

  let res: Response;
  try {
    res = await fetch(`${env.backendUrl}/auth/login/lookup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch (error) {
    // Network error
    console.error('[auth/lookup] Network error:', error);
    return handleBackendError(error, `${env.backendUrl}/auth/login/lookup`);
  }

  // Check for 5xx errors and transform them
  const processed = await processBackendResponse(res, `${env.backendUrl}/auth/login/lookup`);
  if (processed) {
    console.log('[auth/lookup] Response was 5xx, transformed to 503');
    return processed;
  }

  // Success or 4xx → proxy as is
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

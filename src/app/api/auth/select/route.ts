import { NextResponse } from 'next/server';

import { isAuthCookieSecure } from '@/shared/lib/cookie-secure';
import { env } from '@/shared/config/env';
import { handleBackendError, processBackendResponse } from '@/shared/lib/handle-backend-error';

type SelectRequestBody = {
  accountId?: string;
  lookupToken?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as SelectRequestBody;
  const accountId = (body.accountId ?? '').trim();
  const lookupToken = (body.lookupToken ?? '').trim();

  if (!accountId) return NextResponse.json({ message: 'accountId is required' }, { status: 400 });
  if (!lookupToken)
    return NextResponse.json({ message: 'lookupToken is required' }, { status: 400 });

  let res: Response;
  try {
    res = await fetch(`${env.backendUrl}/auth/login/select`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId, lookupToken }),
      cache: 'no-store',
    });
  } catch (error) {
    // Network error
    console.error('[auth/select] Network error:', error);
    return handleBackendError(error, `${env.backendUrl}/auth/login/select`);
  }

  // Check for 5xx errors and transform them
  const processed = await processBackendResponse(res, `${env.backendUrl}/auth/login/select`);
  if (processed) {
    console.log('[auth/select] Response was 5xx, transformed to 503');
    return processed;
  }

  const payloadText = await res.text();
  const next = new NextResponse(payloadText, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });

  // 4xx errors → proxy as is (validation errors)
  if (!res.ok) return next;

  // Expected backend response: { accessToken, refreshToken, expiresIn, user }
  const payload = JSON.parse(payloadText) as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: unknown;
  };

  console.log('[auth/select] Setting cookies after login');
  console.log('[auth/select] Access token length:', payload.accessToken.length);
  console.log('[auth/select] Refresh token length:', payload.refreshToken.length);
  console.log('[auth/select] Expires in:', payload.expiresIn, 'seconds');

  const secure = isAuthCookieSecure();
  const accessMaxAge = Math.max(60, Math.floor(payload.expiresIn)); // At least 60 seconds
  const refreshMaxAge = 60 * 60 * 24 * 30; // 30 days (frontend-side policy)

  console.log('[auth/select] Cookie max ages - access:', accessMaxAge, 'refresh:', refreshMaxAge);

  next.cookies.set('tc_account_id', accountId, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshMaxAge,
  });

  next.cookies.set('tc_access', payload.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: accessMaxAge,
  });

  next.cookies.set('tc_refresh', payload.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshMaxAge,
  });

  console.log('[auth/select] Cookies set successfully');

  return next;
}

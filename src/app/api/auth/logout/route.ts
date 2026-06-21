import { NextResponse } from 'next/server';

import { isAuthCookieSecure } from '@/shared/lib/cookie-secure';
import { resolvePublicOrigin } from '@/shared/lib/request-origin';

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export async function POST(req: Request) {
  const secure = isAuthCookieSecure();
  const next = NextResponse.redirect(new URL('/login', resolvePublicOrigin(req)), 303);

  // Auth cookies
  next.cookies.set('tc_access', '', cookieOptions(secure));
  next.cookies.set('tc_refresh', '', cookieOptions(secure));
  next.cookies.set('tc_account_id', '', cookieOptions(secure));

  // If/when CSRF is enabled (double-submit), clear it too.
  next.cookies.set('tc_csrf', '', { secure, sameSite: 'lax', path: '/', maxAge: 0 });

  return next;
}

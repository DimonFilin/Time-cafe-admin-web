import { NextResponse } from 'next/server';

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
  const secure = process.env.NODE_ENV === 'production';
  const next = NextResponse.redirect(new URL('/login', req.url), 303);

  // Auth cookies
  next.cookies.set('tc_access', '', cookieOptions(secure));
  next.cookies.set('tc_refresh', '', cookieOptions(secure));
  next.cookies.set('tc_account_id', '', cookieOptions(secure));

  // If/when CSRF is enabled (double-submit), clear it too.
  next.cookies.set('tc_csrf', '', { secure, sameSite: 'lax', path: '/', maxAge: 0 });

  return next;
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set(['/login', '/admin']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const access = req.cookies.get('tc_access')?.value;
  const accountId = req.cookies.get('tc_account_id')?.value;
  const refresh = req.cookies.get('tc_refresh')?.value;

  // tc_access expires in ~5 min; tc_refresh lasts longer. Allow navigation when
  // refresh + account are present — BFF routes refresh the access token on API calls.
  const hasSession = Boolean(accountId && (access || refresh));

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Apply to all routes except:
     * - Next internals
     * - static assets
     * - API routes (including /api/auth/*)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)',
  ],
};

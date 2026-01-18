import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { refreshAccessToken, setTokenCookies } from '@/shared/lib/refresh-token';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const accountId = cookieStore.get('tc_account_id')?.value;
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

  const accessToken = cookieStore.get('tc_access')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let response = await fetch(`${env.backendUrl}/auth/me`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      cookie: incomingCookieHeader,
    },
    cache: 'no-store',
  });

  // If 401, try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry with new token
      response = await fetch(`${env.backendUrl}/auth/me`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${refreshed.accessToken}`,
          cookie: incomingCookieHeader,
        },
        cache: 'no-store',
      });

      // If retry succeeded, update cookies
      if (response.ok || response.status !== 401) {
        const text = await response.text();
        const nextResponse = new NextResponse(text, {
          status: response.status,
          headers: {
            'content-type': response.headers.get('content-type') ?? 'application/json',
          },
        });
        await setTokenCookies(nextResponse, refreshed);
        return nextResponse;
      }
    }

    // Refresh failed or retry still returned 401
    const text = await response.text();
    const errorResponse = new NextResponse(text, {
      status: 401,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    });

    // Clear auth cookies
    errorResponse.cookies.delete('tc_access');
    errorResponse.cookies.delete('tc_refresh');
    errorResponse.cookies.delete('tc_account_id');

    return errorResponse;
  }

  // Success or other error - return as is
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}

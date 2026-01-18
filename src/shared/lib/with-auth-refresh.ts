import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessToken, setTokenCookies } from './refresh-token';

export interface AuthFetchOptions {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  cache?: RequestCache;
}

/**
 * Fetch with automatic token refresh on 401
 * If 401 is received, tries to refresh token and retry the request
 * Returns response with updated cookies if refresh succeeded
 */
export async function fetchWithAuthRefresh(
  url: string,
  options: AuthFetchOptions = {},
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('tc_access')?.value;
  const refreshToken = cookieStore.get('tc_refresh')?.value;

  console.log('[with-auth-refresh] Starting request to:', url);
  console.log('[with-auth-refresh] Has access token:', !!accessToken);
  console.log('[with-auth-refresh] Has refresh token:', !!refreshToken);

  // If no access token but have refresh token, try to refresh first
  if (!accessToken && refreshToken) {
    console.log('[with-auth-refresh] No access token, but have refresh token - attempting refresh');
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      console.log(
        '[with-auth-refresh] Token refreshed, waiting 3 seconds before using new token...',
      );
      // Wait 3 seconds to ensure cookies are properly set
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log('[with-auth-refresh] Using new access token for request');

      // Use refreshed token for the request
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${refreshed.accessToken}`,
          ...options.headers,
        },
        body: options.body,
        cache: options.cache || 'no-store',
      });

      if (response.ok || response.status !== 401) {
        const text = await response.text();
        const nextResponse = new NextResponse(text, {
          status: response.status,
          headers: {
            'content-type': response.headers.get('content-type') ?? 'application/json',
          },
        });
        await setTokenCookies(nextResponse, refreshed);
        console.log('[with-auth-refresh] Request succeeded after refresh');
        return nextResponse;
      }
    }
  }

  if (!accessToken) {
    console.error('[with-auth-refresh] No access token found and refresh failed');
    const errorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    errorResponse.cookies.delete('tc_access');
    errorResponse.cookies.delete('tc_refresh');
    errorResponse.cookies.delete('tc_account_id');
    return errorResponse;
  }

  // First attempt
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    body: options.body,
    cache: options.cache || 'no-store',
  });

  console.log('[with-auth-refresh] First attempt status:', response.status);

  // If 401, try to refresh token
  if (response.status === 401) {
    console.log('[with-auth-refresh] Got 401, attempting token refresh for:', url);
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      console.log('[with-auth-refresh] Token refreshed, waiting 3 seconds before retry...');
      // Wait 3 seconds to ensure cookies are properly set
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log('[with-auth-refresh] Retrying request with new token');

      // Retry with new token
      const retryResponse = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${refreshed.accessToken}`,
          ...options.headers,
        },
        body: options.body,
        cache: options.cache || 'no-store',
      });

      // If retry succeeded, update cookies
      if (retryResponse.ok || retryResponse.status !== 401) {
        console.log('[with-auth-refresh] Retry succeeded, updating cookies');
        const text = await retryResponse.text();
        const nextResponse = new NextResponse(text, {
          status: retryResponse.status,
          headers: {
            'content-type': retryResponse.headers.get('content-type') ?? 'application/json',
          },
        });
        await setTokenCookies(nextResponse, refreshed);
        console.log('[with-auth-refresh] Request succeeded after refresh and retry');
        return nextResponse;
      }

      // Retry still returned 401 - use retry response
      console.error('[with-auth-refresh] Retry still returned 401');
      const text = await retryResponse.text();
      const errorResponse = new NextResponse(text, {
        status: 401,
        headers: {
          'content-type': retryResponse.headers.get('content-type') ?? 'application/json',
        },
      });

      // Clear auth cookies
      errorResponse.cookies.delete('tc_access');
      errorResponse.cookies.delete('tc_refresh');
      errorResponse.cookies.delete('tc_account_id');

      return errorResponse;
    }

    // Refresh failed - clear cookies and return 401
    console.error('[with-auth-refresh] Token refresh failed, clearing cookies');
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

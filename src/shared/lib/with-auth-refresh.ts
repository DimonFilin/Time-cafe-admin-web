import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessToken, setTokenCookies } from './refresh-token';
import { handleBackendError, processBackendResponse } from './handle-backend-error';

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
  const accountId = cookieStore.get('tc_account_id')?.value;

  const buildHeaders = (token: string): Headers => {
    const headers = new Headers(options.headers);
    headers.set('authorization', `Bearer ${token}`);

    if (accountId) {
      headers.set('cookie', `tc_account_id=${accountId}`);
    }

    // Don't set Content-Type for FormData, let fetch set it with boundary.
    // Using Headers#set guarantees we don't send duplicate content-type values
    // (e.g. "application/json, application/json"), which breaks JSON body parsing on the backend.
    if (options.body instanceof FormData) {
      headers.delete('content-type');
    } else if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    return headers;
  };

  // If no access token but have refresh token, try to refresh first
  if (!accessToken && refreshToken) {
    console.log('[with-auth-refresh] No access token, but have refresh token - attempting refresh');
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      console.log('[with-auth-refresh] Token refreshed, using new access token for request');

      // Use refreshed token for the request
      let response: Response;
      try {
        const headers = buildHeaders(refreshed.accessToken);
        response = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body: options.body,
          cache: options.cache || 'no-store',
        });
      } catch (error) {
        // Network error
        console.error('[with-auth-refresh] Network error after refresh:', error);
        return handleBackendError(error, url);
      }

      if (response.ok || response.status !== 401) {
        // Check for 5xx errors and transform them
        const processed = await processBackendResponse(response, url);
        if (processed) {
          // 5xx error was transformed, but we still need to set cookies
          await setTokenCookies(processed, refreshed);
          console.log('[with-auth-refresh] Request returned 5xx, transformed to 503');
          return processed;
        }

        // 2xx, 3xx, 4xx → proxy as is
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
  let response: Response;
  try {
    const headers = buildHeaders(accessToken);
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body,
      cache: options.cache || 'no-store',
    });

    console.log('[with-auth-refresh] First attempt status:', response.status);
  } catch (error) {
    // Network error
    console.error('[with-auth-refresh] Network error on first attempt:', error);
    return handleBackendError(error, url);
  }

  // If 401, try to refresh token
  if (response.status === 401) {
    console.log('[with-auth-refresh] Got 401, attempting token refresh for:', url);
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      console.log('[with-auth-refresh] Token refreshed, retrying request with new token');

      // Retry with new token
      let retryResponse: Response;
      try {
        const retryHeaders = buildHeaders(refreshed.accessToken);
        retryResponse = await fetch(url, {
          method: options.method || 'GET',
          headers: retryHeaders,
          body: options.body,
          cache: options.cache || 'no-store',
        });
      } catch (error) {
        // Network error on retry
        console.error('[with-auth-refresh] Network error on retry:', error);
        return handleBackendError(error, url);
      }

      // If retry succeeded, update cookies
      if (retryResponse.ok || retryResponse.status !== 401) {
        console.log('[with-auth-refresh] Retry succeeded, updating cookies');

        // Check for 5xx errors and transform them
        const processed = await processBackendResponse(retryResponse, url);
        if (processed) {
          // 5xx error was transformed, but we still need to set cookies
          await setTokenCookies(processed, refreshed);
          console.log('[with-auth-refresh] Retry returned 5xx, transformed to 503');
          return processed;
        }

        // 2xx, 3xx, 4xx → proxy as is
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

  // Check for 5xx errors and transform them
  const processed = await processBackendResponse(response, url);
  if (processed) {
    console.log('[with-auth-refresh] Response was 5xx, transformed to 503');
    return processed;
  }

  // Success or 4xx error - proxy as is
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}

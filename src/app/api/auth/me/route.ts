import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { refreshAccessToken, setTokenCookies } from '@/shared/lib/refresh-token';
import { handleBackendError, processBackendResponse } from '@/shared/lib/handle-backend-error';

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
  const refreshToken = cookieStore.get('tc_refresh')?.value;

  let currentAccessToken = accessToken;
  if (!currentAccessToken && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      currentAccessToken = refreshed.accessToken;
    }
  }

  if (!currentAccessToken) {
    return NextResponse.json(
      { message: 'Unauthorized', code: 'AUTH_RELOGIN_REQUIRED' },
      { status: 401 },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${env.backendUrl}/auth/me`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${currentAccessToken}`,
        cookie: incomingCookieHeader,
      },
      cache: 'no-store',
    });
  } catch (error) {
    // Network error
    console.error('[auth/me] Network error:', error);
    return handleBackendError(error, `${env.backendUrl}/auth/me`);
  }

  // Check for 5xx errors and transform them
  const processed = await processBackendResponse(response, `${env.backendUrl}/auth/me`);
  if (processed) {
    console.log('[auth/me] Response was 5xx, transformed to 503');
    return processed;
  }

  // If 401, try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry with new token
      try {
        response = await fetch(`${env.backendUrl}/auth/me`, {
          method: 'GET',
          headers: {
            authorization: `Bearer ${refreshed.accessToken}`,
            cookie: incomingCookieHeader,
          },
          cache: 'no-store',
        });
      } catch (error) {
        // Network error on retry
        console.error('[auth/me] Network error on retry:', error);
        return handleBackendError(error, `${env.backendUrl}/auth/me`);
      }

      // Check for 5xx errors and transform them
      const processedRetry = await processBackendResponse(response, `${env.backendUrl}/auth/me`);
      if (processedRetry) {
        // 5xx error was transformed, but we still need to set cookies
        await setTokenCookies(processedRetry, refreshed);
        console.log('[auth/me] Retry returned 5xx, transformed to 503');
        return processedRetry;
      }

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

    // Clear auth cookies but keep selected account id, so UX can relogin without reselecting account.
    errorResponse.cookies.delete('tc_access');
    errorResponse.cookies.delete('tc_refresh');

    return errorResponse;
  }

  // Check for 5xx errors and transform them
  const processedFinal = await processBackendResponse(response, `${env.backendUrl}/auth/me`);
  if (processedFinal) {
    console.log('[auth/me] Final response was 5xx, transformed to 503');
    return processedFinal;
  }

  // Success or 4xx error - return as is
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}

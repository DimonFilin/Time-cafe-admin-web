import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/shared/config/env';

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: unknown; // Backend returns user profile, but we don't need it for refresh
}

/**
 * Refresh access token using refresh token from cookies
 * Returns null if refresh failed
 */
export async function refreshAccessToken(): Promise<RefreshTokenResponse | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('tc_refresh')?.value;

  if (!refreshToken) {
    console.error('[refresh-token] No refresh token found in cookies');
    return null;
  }

  // Log token info (first 20 chars for debugging, not full token for security)
  console.log('[refresh-token] Refresh token found, length:', refreshToken.length);
  console.log('[refresh-token] Refresh token preview:', refreshToken.substring(0, 20) + '...');

  try {
    console.log('[refresh-token] Calling backend /auth/refresh...');
    const res = await fetch(`${env.backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    console.log('[refresh-token] Backend response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[refresh-token] Refresh failed:', res.status, errorText);

      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('[refresh-token] Error details:', errorJson);
      } catch {
        // Not JSON, already logged as text
      }

      return null;
    }

    const data = (await res.json()) as RefreshTokenResponse;
    console.log('[refresh-token] Token refreshed successfully');
    console.log('[refresh-token] New access token length:', data.accessToken.length);
    console.log('[refresh-token] New refresh token length:', data.refreshToken.length);
    console.log('[refresh-token] Expires in:', data.expiresIn, 'seconds');
    return data;
  } catch (error) {
    console.error('[refresh-token] Refresh error:', error);
    if (error instanceof Error) {
      console.error('[refresh-token] Error message:', error.message);
      console.error('[refresh-token] Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Update access and refresh token cookies
 * Preserves tc_account_id cookie if it exists
 */
export async function setTokenCookies(
  response: NextResponse,
  tokens: RefreshTokenResponse,
): Promise<void> {
  const cookieStore = await cookies();
  const accountId = cookieStore.get('tc_account_id')?.value;

  const secure = process.env.NODE_ENV === 'production';
  // expiresIn is in seconds, ensure at least 60 seconds (1 minute) for access token
  const accessMaxAge = Math.max(60, Math.floor(tokens.expiresIn));
  const refreshMaxAge = 60 * 60 * 24; // 24 hours

  console.log(
    '[refresh-token] Setting cookies - accessMaxAge:',
    accessMaxAge,
    'refreshMaxAge:',
    refreshMaxAge,
  );

  response.cookies.set('tc_access', tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: accessMaxAge,
  });

  response.cookies.set('tc_refresh', tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshMaxAge,
  });

  // Preserve account_id if it exists
  if (accountId) {
    response.cookies.set('tc_account_id', accountId, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAge,
    });
  }
}

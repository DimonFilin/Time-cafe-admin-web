import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/shared/config/env';
import { refreshAccessToken, setTokenCookies } from '@/shared/lib/refresh-token';

export async function POST() {
  console.log('[refresh-route] Manual refresh token request received');

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('tc_refresh')?.value;
  const accessToken = cookieStore.get('tc_access')?.value;
  const accountId = cookieStore.get('tc_account_id')?.value;

  console.log('[refresh-route] Current tokens state:');
  console.log('[refresh-route] - Has refresh token:', !!refreshToken);
  if (refreshToken) {
    console.log('[refresh-route] - Refresh token length:', refreshToken.length);
    console.log('[refresh-route] - Refresh token preview:', refreshToken.substring(0, 30) + '...');
  }
  console.log('[refresh-route] - Has access token:', !!accessToken);
  if (accessToken) {
    console.log('[refresh-route] - Access token length:', accessToken.length);
  }
  console.log('[refresh-route] - Has account id:', !!accountId);
  if (accountId) {
    console.log('[refresh-route] - Account id:', accountId);
  }

  if (!refreshToken) {
    console.error('[refresh-route] No refresh token found');
    return NextResponse.json(
      { message: 'No refresh token found', success: false },
      { status: 401 },
    );
  }

  console.log('[refresh-route] Attempting to refresh token...');
  const refreshed = await refreshAccessToken();

  if (!refreshed) {
    console.error('[refresh-route] Refresh failed');
    const errorResponse = NextResponse.json(
      { message: 'Token refresh failed', success: false },
      { status: 401 },
    );
    errorResponse.cookies.delete('tc_access');
    errorResponse.cookies.delete('tc_refresh');
    errorResponse.cookies.delete('tc_account_id');
    return errorResponse;
  }

  console.log('[refresh-route] Refresh successful!');
  console.log('[refresh-route] New tokens:');
  console.log('[refresh-route] - New access token length:', refreshed.accessToken.length);
  console.log('[refresh-route] - New refresh token length:', refreshed.refreshToken.length);
  console.log('[refresh-route] - Expires in:', refreshed.expiresIn, 'seconds');

  const response = NextResponse.json({
    message: 'Token refreshed successfully',
    success: true,
    expiresIn: refreshed.expiresIn,
  });

  await setTokenCookies(response, refreshed);

  console.log('[refresh-route] Cookies updated in response');

  return response;
}

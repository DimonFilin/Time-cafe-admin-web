import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { refreshAccessToken, setTokenCookies } from '@/shared/lib/refresh-token';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('tc_access')?.value;

  if (!accessToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.json({ token: refreshed.accessToken });
    await setTokenCookies(response, refreshed);
    return response;
  }

  return NextResponse.json({ token: accessToken });
}

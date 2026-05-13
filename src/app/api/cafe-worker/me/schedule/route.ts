import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET() {
  try {
    const url = `${env.backendUrl}/cafe-worker/me/schedule`;
    return fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[cafe-worker/me/schedule] Error:', error);
    return NextResponse.json({ error: 'Failed to load schedule' }, { status: 500 });
  }
}

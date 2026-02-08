import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function PATCH(req: NextRequest) {
  try {
    const backendUrl = `${env.backendUrl}/cafe-worker/shift-status`;

    const response = await fetchWithAuthRefresh(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  } catch (error) {
    console.error('[shift-status] Error:', error);
    return NextResponse.json({ error: 'Failed to toggle shift status' }, { status: 500 });
  }
}

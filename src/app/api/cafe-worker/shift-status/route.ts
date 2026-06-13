import { NextRequest, NextResponse } from 'next/server';
import { t } from '@/i18n';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(request: NextRequest) {
  try {
    const backendUrl = `${env.backendUrl}/cafe-worker/shift-status`;
    const body = await request.text();

    const response = await fetchWithAuthRefresh(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body || '{}',
    });

    return response;
  } catch (error) {
    console.error('[shift-status] Error:', error);
    return NextResponse.json({ error: t('apiErrors.toggleShiftStatus') }, { status: 500 });
  }
}

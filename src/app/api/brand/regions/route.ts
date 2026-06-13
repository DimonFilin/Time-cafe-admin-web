import { NextResponse } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

export async function GET() {
  try {
    const url = `${env.backendUrl}/regions`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/regions] Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

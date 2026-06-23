import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${env.backendUrl}/cafe-admin/overview/stats${queryString ? `?${queryString}` : ''}`;

    return fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Cafe admin overview stats GET error:', error);
    return NextResponse.json({ error: t('apiErrors.internalServer') }, { status: 500 });
  }
}

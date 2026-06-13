import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';
import { t } from '@/i18n';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const url = new URL(`${env.backendUrl}/appointments/cafe/${cafeId}`);
    if (status) {
      url.searchParams.set('status', status);
    }

    const response = await fetchWithAuthRefresh(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[appointments-proxy] Error:', error);
    return NextResponse.json({ message: t('apiErrors.fetchAppointments') }, { status: 500 });
  }
}

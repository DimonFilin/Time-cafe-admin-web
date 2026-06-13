import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';
import { t } from '@/i18n';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cafeId: string; appointmentId: string }> },
) {
  try {
    const { cafeId, appointmentId } = await params;

    const url = `${env.backendUrl}/appointments/cafe/${cafeId}/${appointmentId}`;

    const response = await fetchWithAuthRefresh(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[appointment-details-proxy] Error:', error);
    return NextResponse.json({ message: t('apiErrors.fetchAppointmentDetails') }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';
import { t } from '@/i18n';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;
    const body = await req.json();

    const url = `${env.backendUrl}/appointments/cafe/${appointmentId}/cancel`;

    const response = await fetchWithAuthRefresh(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[cancel-appointment-proxy] Error:', error);
    return NextResponse.json({ message: t('apiErrors.cancelAppointment') }, { status: 500 });
  }
}

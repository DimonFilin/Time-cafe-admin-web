import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;
    const url = `${env.backendUrl}/appointments/cafe/${appointmentId}/checkin`;

    const response = await fetchWithAuthRefresh(url, { method: 'POST' });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[checkin-appointment-proxy] Error:', error);
    return NextResponse.json({ message: 'Failed to check-in appointment' }, { status: 500 });
  }
}

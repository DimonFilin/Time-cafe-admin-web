import { NextResponse } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Build backend URL
    const url = `${env.backendUrl}/activity-logs/${id}`;

    // Proxy request to backend with auth refresh
    const response = await fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });

    return response;
  } catch (error) {
    console.error('[api/activity-logs/[id]] GET Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

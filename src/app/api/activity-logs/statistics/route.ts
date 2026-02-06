import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Build backend URL with query parameters
    const url = `${env.backendUrl}/activity-logs/statistics${queryString ? `?${queryString}` : ''}`;

    // Proxy request to backend with auth refresh
    const response = await fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });

    return response;
  } catch (error) {
    console.error('[api/activity-logs/statistics] GET Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

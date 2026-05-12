import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const url = `${env.backendUrl}/activity-logs`;
    return fetchWithAuthRefresh(url, {
      method: 'POST',
      body,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/activity-logs] POST Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[api/activity-logs] GET - Starting request');

    // Get query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    console.log('[api/activity-logs] Query params:', queryString);

    // Build backend URL with query parameters
    const url = `${env.backendUrl}/activity-logs${queryString ? `?${queryString}` : ''}`;
    console.log('[api/activity-logs] Backend URL:', url);

    // Proxy request to backend with auth refresh
    const response = await fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });

    console.log('[api/activity-logs] Response status:', response.status);

    if (response.status >= 400) {
      const text = await response.text();
      console.error('[api/activity-logs] Error response:', text);
    }

    return response;
  } catch (error) {
    console.error('[api/activity-logs] GET Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${env.backendUrl}/cafe-admin/tasks/templates${queryString ? `?${queryString}` : ''}`;

    return fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Cafe admin tasks templates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch task templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Next.js Proxy] POST /cafe-admin/tasks/templates - Body:', body);

    const url = `${env.backendUrl}/cafe-admin/tasks/templates`;
    console.log('[Next.js Proxy] Forwarding to:', url);

    const response = await fetchWithAuthRefresh(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const responseData = await response.json().catch(() => null);
    console.log('[Next.js Proxy] Backend response:', response.status, responseData);

    if (!response.ok) {
      return NextResponse.json(responseData || { error: 'Backend error' }, {
        status: response.status,
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Cafe admin tasks templates POST error:', error);
    return NextResponse.json({ error: 'Failed to create task template' }, { status: 500 });
  }
}

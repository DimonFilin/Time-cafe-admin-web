import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${env.backendUrl}/cafe-admin/workers${queryString ? `?${queryString}` : ''}`;

    return fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Cafe admin workers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${env.backendUrl}/cafe-admin/workers`;

    return fetchWithAuthRefresh(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cafe admin workers POST error:', error);
    return NextResponse.json({ error: 'Failed to invite worker' }, { status: 500 });
  }
}

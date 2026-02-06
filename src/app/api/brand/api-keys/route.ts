import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ message: 'brandId is required' }, { status: 400 });
    }

    const url = `${env.backendUrl}/brands/${brandId}/api-keys`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/api-keys] GET Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, ...data } = body;

    if (!brandId) {
      return NextResponse.json({ message: 'brandId is required' }, { status: 400 });
    }

    const url = `${env.backendUrl}/brands/${brandId}/api-keys`;
    return await fetchWithAuthRefresh(url, {
      method: 'POST',
      body: JSON.stringify(data),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/brand/api-keys] POST Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

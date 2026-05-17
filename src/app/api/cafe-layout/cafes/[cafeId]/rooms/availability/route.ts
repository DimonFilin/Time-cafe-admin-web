import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(request: NextRequest, context: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await context.params;
    const date = request.nextUrl.searchParams.get('date');
    const url = `${env.backendUrl}/cafe-layout/cafes/${cafeId}/rooms/availability${date ? `?date=${date}` : ''}`;
    return fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[cafe-layout rooms availability GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load rooms availability' }, { status: 500 });
  }
}

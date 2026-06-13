import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

export async function GET(request: NextRequest, context: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await context.params;
    const date = request.nextUrl.searchParams.get('date');
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const qs = new URLSearchParams();
    if (date) qs.set('date', date);
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    const url = `${env.backendUrl}/cafe-layout/cafes/${cafeId}/occupancy${q ? `?${q}` : ''}`;
    return fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[cafe-layout occupancy GET] Error:', error);
    return NextResponse.json({ error: t('apiErrors.loadOccupancy') }, { status: 500 });
  }
}

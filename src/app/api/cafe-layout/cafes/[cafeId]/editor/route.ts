import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

export async function GET(_request: NextRequest, context: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await context.params;
    const url = `${env.backendUrl}/cafe-layout/cafes/${cafeId}/editor`;
    return fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[cafe-layout editor GET] Error:', error);
    return NextResponse.json({ error: t('apiErrors.loadLayoutEditor') }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await context.params;
    const body = await request.text();
    const url = `${env.backendUrl}/cafe-layout/cafes/${cafeId}/editor`;
    return fetchWithAuthRefresh(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[cafe-layout editor PUT] Error:', error);
    return NextResponse.json({ error: t('apiErrors.saveLayoutEditor') }, { status: 500 });
  }
}

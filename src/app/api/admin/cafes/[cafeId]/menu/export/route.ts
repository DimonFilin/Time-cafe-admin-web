import { NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';
import { t } from '@/i18n';

export async function GET(_req: Request, { params }: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await params;
    const url = `${env.backendUrl}/admin/cafes/${cafeId}/menu/export`;
    return fetchWithAuthRefresh(url, { method: 'GET' });
  } catch (error) {
    console.error('[admin-cafe-menu-export] GET failed:', error);
    return NextResponse.json({ message: t('apiErrors.exportMenu') }, { status: 500 });
  }
}

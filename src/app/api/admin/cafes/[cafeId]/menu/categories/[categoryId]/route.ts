import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';
import { t } from '@/i18n';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cafeId: string; categoryId: string }> },
) {
  try {
    const { cafeId, categoryId } = await params;
    const body = await req.json();
    const url = `${env.backendUrl}/admin/cafes/${cafeId}/menu/categories/${categoryId}`;
    return fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[admin-cafe-menu-category] PATCH failed:', error);
    return NextResponse.json({ message: t('apiErrors.updateMenuCategory') }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cafeId: string; categoryId: string }> },
) {
  try {
    const { cafeId, categoryId } = await params;
    const url = `${env.backendUrl}/admin/cafes/${cafeId}/menu/categories/${categoryId}`;
    return fetchWithAuthRefresh(url, { method: 'DELETE' });
  } catch (error) {
    console.error('[admin-cafe-menu-category] DELETE failed:', error);
    return NextResponse.json({ message: t('apiErrors.deleteMenuCategory') }, { status: 500 });
  }
}

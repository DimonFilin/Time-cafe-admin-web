import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cafeId: string; itemId: string }> },
) {
  try {
    const { cafeId, itemId } = await params;
    const body = await req.json();
    const url = `${env.backendUrl}/admin/cafes/${cafeId}/menu/items/${itemId}`;
    return fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[admin-cafe-menu-item] PATCH failed:', error);
    return NextResponse.json({ message: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cafeId: string; itemId: string }> },
) {
  try {
    const { cafeId, itemId } = await params;
    const url = `${env.backendUrl}/admin/cafes/${cafeId}/menu/items/${itemId}`;
    return fetchWithAuthRefresh(url, { method: 'DELETE' });
  } catch (error) {
    console.error('[admin-cafe-menu-item] DELETE failed:', error);
    return NextResponse.json({ message: 'Failed to delete menu item' }, { status: 500 });
  }
}

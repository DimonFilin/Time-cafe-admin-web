import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function POST(req: NextRequest, { params }: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await params;
    const body = await req.json();
    const url = `${env.backendUrl}/admin/cafes/${cafeId}/menu/categories`;
    return fetchWithAuthRefresh(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[admin-cafe-menu-categories] POST failed:', error);
    return NextResponse.json({ message: 'Failed to create menu category' }, { status: 500 });
  }
}

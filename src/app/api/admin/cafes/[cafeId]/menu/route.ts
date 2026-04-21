import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await params;
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive');

    const url = new URL(`${env.backendUrl}/admin/cafes/${cafeId}/menu`);
    if (includeInactive) url.searchParams.set('includeInactive', includeInactive);

    return fetchWithAuthRefresh(url.toString(), { method: 'GET' });
  } catch (error) {
    console.error('[admin-cafe-menu] GET failed:', error);
    return NextResponse.json({ message: 'Failed to fetch menu' }, { status: 500 });
  }
}

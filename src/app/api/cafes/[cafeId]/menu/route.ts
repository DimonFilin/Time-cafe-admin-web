import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/shared/config/env';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ cafeId: string }> }) {
  try {
    const { cafeId } = await params;
    const url = `${env.backendUrl}/cafes/${cafeId}/menu`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[cafes-menu] GET failed:', error);
    return NextResponse.json({ message: 'Failed to fetch menu' }, { status: 500 });
  }
}

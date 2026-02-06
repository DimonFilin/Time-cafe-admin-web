import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;

    // Update worker
    const url = `${env.backendUrl}/auth/workers/${id}`;
    return await fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/brand/workers/[id]] PATCH Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Delete worker
    const url = `${env.backendUrl}/auth/workers/${id}`;
    return await fetchWithAuthRefresh(url, { method: 'DELETE', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/workers/[id]] DELETE Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

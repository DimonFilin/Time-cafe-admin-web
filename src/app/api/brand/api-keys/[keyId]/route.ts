import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
) {
  try {
    const body = await request.json();
    const { keyId } = await params;
    const { brandId, ...data } = body;

    if (!brandId) {
      return NextResponse.json({ message: 'brandId is required' }, { status: 400 });
    }

    const url = `${env.backendUrl}/brands/${brandId}/api-keys/${keyId}`;
    return await fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/brand/api-keys/[keyId]] PATCH Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
) {
  try {
    const body = await request.json();
    const { keyId } = await params;
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json({ message: 'brandId is required' }, { status: 400 });
    }

    const url = `${env.backendUrl}/brands/${brandId}/api-keys/${keyId}`;
    return await fetchWithAuthRefresh(url, {
      method: 'DELETE',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/brand/api-keys/[keyId]] DELETE Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

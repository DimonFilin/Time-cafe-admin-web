import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: brandId } = await params;

    // Get signed URL for banner via backend
    const url = `${env.backendUrl}/brands/${brandId}/banner-url`;
    const response = await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { message: text || 'Failed to get banner URL' },
        { status: response.status },
      );
    }

    // Return the signed URL
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/brand/[id]/banner-url] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

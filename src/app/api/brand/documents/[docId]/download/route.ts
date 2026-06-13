import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const { docId } = await params;

    // Get download URL for document via backend
    const url = `${env.backendUrl}/brands/documents/${docId}/download-url`;
    const response = await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { message: text || t('apiErrors.downloadDocument') },
        { status: response.status },
      );
    }

    // Return the signed download URL
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/brand/documents/[id]/download] Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

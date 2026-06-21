import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { fetchBrandIdOrAuthError } from '@/shared/lib/brand-worker-auth';
import { t } from '@/i18n';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const { docId } = await params;
    const url = `${env.backendUrl}/brands/${auth.brandId}/documents/${docId}`;
    return await fetchWithAuthRefresh(url, { method: 'DELETE', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents/[docId]] DELETE error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const { docId } = await params;
    const url = `${env.backendUrl}/brands/${auth.brandId}/documents/${docId}`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents/[docId]] GET error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

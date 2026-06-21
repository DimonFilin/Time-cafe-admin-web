import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { fetchBrandIdOrAuthError } from '@/shared/lib/brand-worker-auth';
import { t } from '@/i18n';

export async function GET() {
  try {
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const url = `${env.backendUrl}/brands/${auth.brandId}/documents`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents] GET error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const url = `${env.backendUrl}/brands/${auth.brandId}/documents`;
    return await fetchWithAuthRefresh(url, { method: 'POST', body: form, cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents] POST error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

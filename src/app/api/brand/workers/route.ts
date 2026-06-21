import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { fetchBrandIdOrAuthError } from '@/shared/lib/brand-worker-auth';
import { t } from '@/i18n';

export async function GET(request: NextRequest) {
  try {
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    const url = `${env.backendUrl}/admin/workers?brandId=${auth.brandId}&page=${page}&limit=${limit}`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/workers] GET Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const url = `${env.backendUrl}/auth/workers`;
    return await fetchWithAuthRefresh(url, {
      method: 'POST',
      body: JSON.stringify({ ...body, brandId: auth.brandId }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/brand/workers] POST Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

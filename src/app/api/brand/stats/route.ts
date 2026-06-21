import { NextResponse } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { fetchBrandIdOrAuthError } from '@/shared/lib/brand-worker-auth';
import { t } from '@/i18n';

export async function GET() {
  try {
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const url = `${env.backendUrl}/brands/my/stats`;
    const response = await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[api/brand/stats] Backend error:', errorText);
      return NextResponse.json(
        { message: errorText || t('apiErrors.fetchBrandStats') },
        { status: response.status },
      );
    }

    return response;
  } catch (error) {
    console.error('[api/brand/stats] Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : t('apiErrors.internalServer') },
      { status: 500 },
    );
  }
}

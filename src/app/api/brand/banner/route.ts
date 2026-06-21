import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { fetchBrandIdOrAuthError } from '@/shared/lib/brand-worker-auth';
import { t } from '@/i18n';

export async function POST(request: NextRequest) {
  try {
    const auth = await fetchBrandIdOrAuthError();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadUrl = `${env.backendUrl}/brands/${auth.brandId}/banner`;
    const uploadResponse = await fetchWithAuthRefresh(uploadUrl, {
      method: 'POST',
      body: uploadFormData,
      cache: 'no-store',
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text().catch(() => '');
      return NextResponse.json(
        { message: text || t('apiErrors.uploadFailedStatus') },
        { status: uploadResponse.status },
      );
    }

    const result = await uploadResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/brand/banner] POST Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : t('apiErrors.internalServer') },
      { status: 500 },
    );
  }
}

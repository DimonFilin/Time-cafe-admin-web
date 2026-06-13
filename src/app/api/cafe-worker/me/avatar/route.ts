import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: t('apiErrors.uploadFile') }, { status: 400 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    return fetchWithAuthRefresh(`${env.backendUrl}/cafe-worker/me/avatar`, {
      method: 'POST',
      body: uploadFormData,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[cafe-worker/me/avatar] POST Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : t('apiErrors.internalServer') },
      { status: 500 },
    );
  }
}

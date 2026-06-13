import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

async function getWorkerBrandId(): Promise<string> {
  const workerUrl = `${env.backendUrl}/auth/workers/me`;
  const response = await fetchWithAuthRefresh(workerUrl, { method: 'GET', cache: 'no-store' });

  if (!response || typeof response.status !== 'number') {
    throw new Error(t('apiErrors.invalidWorkerResponse'));
  }

  if (response.status >= 400) {
    const text = await response.text().catch(() => '');
    throw new Error(t('apiErrors.fetchWorkerAuth'));
  }

  const text = await response.text().catch(() => '');
  const worker = text ? JSON.parse(text) : null;

  if (!worker?.brandId) {
    throw new Error(t('apiErrors.noBrandForWorker'));
  }

  return worker.brandId;
}

export async function POST(request: NextRequest) {
  try {
    const brandId = await getWorkerBrandId();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Upload to backend
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadUrl = `${env.backendUrl}/brands/${brandId}/logo`;
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
    console.error('[api/brand/logo] POST Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : t('apiErrors.internalServer') },
      { status: 500 },
    );
  }
}

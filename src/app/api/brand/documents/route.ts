import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

interface WorkerResponse {
  brandId: string;
  [key: string]: unknown;
}

async function getWorkerWithAuthRefresh(): Promise<WorkerResponse> {
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
  return text ? JSON.parse(text) : { brandId: '' }; // Return empty object with brandId property
}

export async function GET() {
  try {
    // get current worker to determine brandId with auth refresh
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId)
      return NextResponse.json({ message: t('apiErrors.noBrandAssociated') }, { status: 400 });

    const url = `${env.backendUrl}/brands/${worker.brandId}/documents`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents] GET error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // forward multipart/form-data to backend
    const form = await request.formData();

    // get worker with auth refresh
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId)
      return NextResponse.json({ message: t('apiErrors.noBrandAssociated') }, { status: 400 });

    const url = `${env.backendUrl}/brands/${worker.brandId}/documents`;
    return await fetchWithAuthRefresh(url, { method: 'POST', body: form, cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents] POST error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

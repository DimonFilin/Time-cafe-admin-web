import { NextResponse } from 'next/server';
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
    // Get current worker with auth refresh
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId) {
      return NextResponse.json({ message: t('apiErrors.noBrandForWorker') }, { status: 400 });
    }

    // Forward request to backend
    const url = `${env.backendUrl}/brands/my/analytics/popular-items`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/analytics/popular-items] GET Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

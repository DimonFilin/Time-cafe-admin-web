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

    // Fetch brand stats from backend using the new endpoint
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

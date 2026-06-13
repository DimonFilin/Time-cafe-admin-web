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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // Get current worker to get brandId with auth refresh
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId) {
      return NextResponse.json({ message: t('apiErrors.noBrandForWorker') }, { status: 400 });
    }

    // Fetch cafes for brand
    const url = `${env.backendUrl}/cafes?brandId=${worker.brandId}&page=${page}&limit=${limit}`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/cafes] GET Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get current worker to get brandId with auth refresh
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId) {
      return NextResponse.json({ message: t('apiErrors.noBrandForWorker') }, { status: 400 });
    }

    // Create cafe with brandId
    const url = `${env.backendUrl}/cafes`;
    return await fetchWithAuthRefresh(url, {
      method: 'POST',
      body: JSON.stringify({ ...body, brandId: worker.brandId }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/brand/cafes] POST Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

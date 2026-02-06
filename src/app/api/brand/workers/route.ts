import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

async function getWorkerWithAuthRefresh() {
  const workerUrl = `${env.backendUrl}/auth/workers/me`;
  const response = await fetchWithAuthRefresh(workerUrl, { method: 'GET', cache: 'no-store' });

  if (!response || typeof response.status !== 'number') {
    throw new Error('Invalid response fetching worker');
  }

  if (response.status >= 400) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch worker: ${response.status} ${text}`);
  }

  const text = await response.text().catch(() => '');
  return text ? JSON.parse(text) : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    // Get current worker to get brandId
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId) {
      return NextResponse.json(
        { message: 'No brand associated with this worker' },
        { status: 400 },
      );
    }

    // Fetch workers for brand
    const url = `${env.backendUrl}/admin/workers?brandId=${worker.brandId}&page=${page}&limit=${limit}`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/workers] GET Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get current worker to get brandId
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId) {
      return NextResponse.json(
        { message: 'No brand associated with this worker' },
        { status: 400 },
      );
    }

    // Invite new worker with brandId
    const url = `${env.backendUrl}/auth/workers`;
    return await fetchWithAuthRefresh(url, {
      method: 'POST',
      body: JSON.stringify({ ...body, brandId: worker.brandId }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[api/brand/workers] POST Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

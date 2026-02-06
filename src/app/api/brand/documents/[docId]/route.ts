import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

interface WorkerResponse {
  brandId: string;
  [key: string]: unknown;
}

async function getWorkerWithAuthRefresh(): Promise<WorkerResponse> {
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
  return text ? JSON.parse(text) : { brandId: '' }; // Return empty object with brandId property
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId)
      return NextResponse.json({ message: 'No brand associated' }, { status: 400 });

    const { docId } = await params;
    const url = `${env.backendUrl}/brands/${worker.brandId}/documents/${docId}`;
    return await fetchWithAuthRefresh(url, { method: 'DELETE', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents/[docId]] DELETE error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId)
      return NextResponse.json({ message: 'No brand associated' }, { status: 400 });

    const { docId } = await params;
    const url = `${env.backendUrl}/brands/${worker.brandId}/documents/${docId}`;
    return await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand/documents/[docId]] GET error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

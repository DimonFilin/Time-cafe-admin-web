import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { handleBackendError, processBackendResponse } from '@/shared/lib/handle-backend-error';

export async function GET() {
  let res: Response;
  try {
    res = await fetch(`${env.backendUrl}/brands`, { cache: 'no-store' });
  } catch (error) {
    // Network error
    console.error('[brands/GET] Network error:', error);
    return handleBackendError(error, `${env.backendUrl}/brands`);
  }

  // Check for 5xx errors and transform them
  const processed = await processBackendResponse(res, `${env.backendUrl}/brands`);
  if (processed) {
    console.log('[brands/GET] Response was 5xx, transformed to 503');
    return processed;
  }

  // Success or 4xx → proxy as is
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  const url = `${env.backendUrl}/brands`;

  return fetchWithAuthRefresh(url, {
    method: 'POST',
    body: bodyText,
    cache: 'no-store',
  });
}

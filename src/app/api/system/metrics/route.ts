import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { handleBackendError, processBackendResponse } from '@/shared/lib/handle-backend-error';

export async function GET() {
  let res: Response;
  try {
    res = await fetch(`${env.backendUrl}/system/metrics`, { cache: 'no-store' });
  } catch (error) {
    console.error('[system/metrics] Network error:', error);
    return handleBackendError(error, `${env.backendUrl}/system/metrics`);
  }

  // Check for 5xx errors and transform them
  const processed = await processBackendResponse(res, `${env.backendUrl}/system/metrics`);
  if (processed) {
    console.log('[system/metrics] Response was 5xx, transformed to 503');
    return processed;
  }

  // Success or 4xx → proxy as is
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

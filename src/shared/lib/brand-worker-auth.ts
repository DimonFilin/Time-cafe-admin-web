import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

export type BrandWorkerProfile = {
  brandId: string;
  [key: string]: unknown;
};

type WorkerAuthResult =
  | { ok: true; worker: BrandWorkerProfile }
  | { ok: false; response: NextResponse };

/** Load current worker for brand-admin routes; pass through 401/403 instead of throwing. */
export async function fetchBrandWorkerOrAuthError(): Promise<WorkerAuthResult> {
  const response = await fetchWithAuthRefresh(`${env.backendUrl}/auth/workers/me`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response || typeof response.status !== 'number') {
    return {
      ok: false,
      response: NextResponse.json(
        { message: t('apiErrors.invalidWorkerResponse') },
        { status: 500 },
      ),
    };
  }

  if (response.status !== 200) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      response: new NextResponse(text || JSON.stringify({ message: 'Unauthorized' }), {
        status: response.status,
        headers: {
          'content-type': response.headers.get('content-type') ?? 'application/json',
        },
      }),
    };
  }

  const text = await response.text().catch(() => '');
  const worker = text ? (JSON.parse(text) as BrandWorkerProfile) : { brandId: '' };
  return { ok: true, worker };
}

export async function fetchBrandIdOrAuthError(): Promise<
  { ok: true; brandId: string; worker: BrandWorkerProfile } | { ok: false; response: NextResponse }
> {
  const auth = await fetchBrandWorkerOrAuthError();
  if (!auth.ok) return auth;
  if (!auth.worker.brandId) {
    return {
      ok: false,
      response: NextResponse.json({ message: t('apiErrors.noBrandForWorker') }, { status: 400 }),
    };
  }
  return { ok: true, brandId: auth.worker.brandId, worker: auth.worker };
}

'use client';

import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

export type WorkerRole = 'SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER';

export type RegisterWorkerInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: WorkerRole;
  brandId?: string;
  cafeId?: string;
};

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function registerWorker(input: RegisterWorkerInput): Promise<{ user?: unknown }> {
  const res = await fetch('/api/system-admin/workers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as { user?: unknown };
}

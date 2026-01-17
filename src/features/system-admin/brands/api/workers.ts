'use client';

import type { WorkerListResponse } from '@/entities/worker/types/worker';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listBrandWorkers(input: {
  brandId: string;
  page: number;
  limit: number;
}): Promise<WorkerListResponse> {
  const res = await fetch(
    `/api/system-admin/brands/${input.brandId}/workers?page=${input.page}&limit=${input.limit}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as WorkerListResponse;
}

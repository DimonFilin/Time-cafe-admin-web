'use client';

import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

export type WorkerRole = 'SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER';

export type WorkerRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: WorkerRole;
  brandId?: string;
  cafeId?: string;
  createdAt: string;
  deletedAt?: string | null;
};

export type WorkerListResponse = {
  items: WorkerRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export type ListWorkersParams = {
  page: number;
  limit: number;
  role?: WorkerRole;
  brandId?: string;
  cafeId?: string;
  includeDeleted?: boolean;
};

export async function listWorkers(params: ListWorkersParams): Promise<WorkerListResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.role) qs.set('role', params.role);
  if (params.brandId) qs.set('brandId', params.brandId);
  if (params.cafeId) qs.set('cafeId', params.cafeId);
  if (params.includeDeleted) qs.set('includeDeleted', 'true');

  const res = await fetch(`/api/system-admin/workers?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as WorkerListResponse;
}

export type RegisterWorkerInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: WorkerRole;
  brandId?: string;
  cafeId?: string;
};

export async function registerWorker(input: RegisterWorkerInput): Promise<{ user?: unknown }> {
  const res = await fetch('/api/system-admin/workers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as { user?: unknown };
}

export type UpdateWorkerInput = {
  firstName?: string;
  lastName?: string;
  role?: WorkerRole;
  brandId?: string;
  cafeId?: string;
};

export async function updateWorker(id: string, input: UpdateWorkerInput): Promise<WorkerRow> {
  const res = await fetch(`/api/system-admin/workers/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as WorkerRow;
}

export async function deleteWorker(id: string): Promise<void> {
  const res = await fetch(`/api/system-admin/workers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readError(res));
}

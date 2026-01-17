'use client';

import type { Cafe, CafeListResponse } from '@/entities/cafe/types/cafe';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listBrandCafes(input: {
  brandId: string;
  page: number;
  limit: number;
}): Promise<CafeListResponse> {
  const res = await fetch(
    `/api/system-admin/brands/${input.brandId}/cafes?page=${input.page}&limit=${input.limit}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as CafeListResponse;
}

export type CreateCafeInput = {
  name: string;
  description?: string;
  address: string;
  city: string;
  street?: string;
  latitude: number;
  longitude: number;
  regionId: string;
  photos?: string[];
  cafeApiUrl?: string;
};

export async function createCafe(input: { brandId: string } & CreateCafeInput): Promise<Cafe> {
  const res = await fetch(`/api/system-admin/brands/${input.brandId}/cafes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Cafe;
}

export type UpdateCafeInput = Partial<CreateCafeInput> & {
  photos?: string[] | undefined;
};

export async function updateCafe(cafeId: string, input: UpdateCafeInput): Promise<Cafe> {
  const res = await fetch(`/api/system-admin/cafes/${cafeId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Cafe;
}

export async function deleteCafe(cafeId: string): Promise<void> {
  const res = await fetch(`/api/system-admin/cafes/${cafeId}`, { method: 'DELETE' });
  if (res.status === 204) return;
  if (!res.ok) throw new Error(await readError(res));
}

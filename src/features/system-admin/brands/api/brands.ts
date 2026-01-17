'use client';

import type { Brand } from '@/entities/brand/types/brand';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

export type CreateBrandInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  website?: string;
};

export type UpdateBrandInput = Partial<CreateBrandInput>;

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listBrands(): Promise<Brand[]> {
  const res = await fetch('/api/system-admin/brands', { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Brand[];
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const res = await fetch('/api/system-admin/brands', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Brand;
}

export async function updateBrand(id: string, input: UpdateBrandInput): Promise<Brand> {
  const res = await fetch(`/api/system-admin/brands/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  const res = await fetch(`/api/system-admin/brands/${id}`, { method: 'DELETE' });
  if (res.status === 204) return;
  if (!res.ok) throw new Error(await readError(res));
}

export async function verifyBrand(id: string): Promise<Brand> {
  const res = await fetch(`/api/system-admin/brands/${id}/verify`, { method: 'POST' });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Brand;
}

export async function rejectBrand(id: string, reason?: string): Promise<Brand> {
  const res = await fetch(`/api/system-admin/brands/${id}/reject`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Brand;
}

export async function suspendBrand(id: string, reason?: string): Promise<Brand> {
  const res = await fetch(`/api/system-admin/brands/${id}/suspend`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Brand;
}

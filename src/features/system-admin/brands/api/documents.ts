'use client';

import type { BrandDocument } from '@/entities/brand/types/document';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listBrandDocuments(brandId: string): Promise<BrandDocument[]> {
  const res = await fetch(`/api/system-admin/brands/${brandId}/documents`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as BrandDocument[];
}

export async function verifyBrandDocument(
  brandId: string,
  docId: string,
  verificationNote?: string,
): Promise<BrandDocument> {
  const res = await fetch(`/api/system-admin/brands/${brandId}/documents/${docId}/verify`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ verificationNote: verificationNote?.trim() || undefined }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as BrandDocument;
}

export async function deleteBrandDocument(brandId: string, docId: string): Promise<void> {
  const res = await fetch(`/api/system-admin/brands/${brandId}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return;
  if (!res.ok) throw new Error(await readError(res));
}

export async function uploadBrandDocument(input: {
  brandId: string;
  type: BrandDocument['type'];
  name: string;
  file: File;
}): Promise<BrandDocument> {
  const form = new FormData();
  form.append('type', input.type);
  form.append('name', input.name);
  form.append('file', input.file);

  const res = await fetch(`/api/system-admin/brands/${input.brandId}/documents`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as BrandDocument;
}

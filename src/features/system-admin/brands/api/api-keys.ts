'use client';

import type { ApiKey, CreatedApiKey } from '@/entities/brand/types/api-key';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listApiKeys(brandId: string): Promise<ApiKey[]> {
  const res = await fetch(`/api/system-admin/brands/${brandId}/api-keys`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ApiKey[];
}

export async function createApiKey(input: {
  brandId: string;
  name: string;
  permissions: string[];
  expiresAt?: string;
}): Promise<CreatedApiKey> {
  const res = await fetch(`/api/system-admin/brands/${input.brandId}/api-keys`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      permissions: input.permissions,
      expiresAt: input.expiresAt,
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as CreatedApiKey;
}

export async function updateApiKey(input: {
  brandId: string;
  keyId: string;
  name?: string;
  permissions?: string[];
  isActive?: boolean;
  expiresAt?: string | null;
}): Promise<ApiKey> {
  const res = await fetch(`/api/system-admin/brands/${input.brandId}/api-keys/${input.keyId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      permissions: input.permissions,
      isActive: input.isActive,
      expiresAt: input.expiresAt,
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ApiKey;
}

export async function deleteApiKey(input: { brandId: string; keyId: string }): Promise<void> {
  const res = await fetch(`/api/system-admin/brands/${input.brandId}/api-keys/${input.keyId}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return;
  if (!res.ok) throw new Error(await readError(res));
}

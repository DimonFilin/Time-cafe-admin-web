'use client';

// Available API key permissions
export const AVAILABLE_PERMISSIONS = [
  { value: 'brands:read', label: 'Read brands' },
  { value: 'brands:create', label: 'Create brands' },
  { value: 'brands:update', label: 'Update brands' },
  { value: 'orders:read', label: 'Read orders' },
  { value: 'orders:create', label: 'Create orders' },
  { value: 'orders:update', label: 'Update orders' },
  { value: 'cafes:read', label: 'Read cafes' },
  { value: 'cafes:create', label: 'Create cafes' },
  { value: 'cafes:update', label: 'Update cafes' },
  { value: 'reviews:read', label: 'Read reviews' },
];

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  permissions?: string[];
}

export interface ApiKeyListResponse {
  items: ApiKey[];
  total: number;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[]; // Required - must have at least 1
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  key: string; // Only returned on creation - must be copied by user (full key shown once)
  status?: string;
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[]; // Optional for update
  expiresAt?: string;
}

export async function listApiKeys(brandId: string): Promise<ApiKey[]> {
  const res = await fetch(`/api/brand/api-keys?brandId=${brandId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.items || [];
}

export async function createApiKey(
  brandId: string,
  request: CreateApiKeyRequest,
): Promise<CreateApiKeyResponse> {
  const res = await fetch(`/api/brand/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandId, ...request }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function updateApiKey(
  brandId: string,
  keyId: string,
  request: UpdateApiKeyRequest,
): Promise<ApiKey> {
  const res = await fetch(`/api/brand/api-keys/${keyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandId, ...request }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function revokeApiKey(brandId: string, keyId: string): Promise<void> {
  const res = await fetch(`/api/brand/api-keys/${keyId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandId }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }
}

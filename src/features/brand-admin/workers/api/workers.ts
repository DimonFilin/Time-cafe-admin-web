'use client';

export interface WorkerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER';
  brandId?: string;
  cafeId?: string;
  createdAt: string;
}

export interface WorkerListResponse {
  items: WorkerProfile[];
  total: number;
  page: number;
  limit: number;
}

export async function listWorkers(params: {
  page?: number;
  limit?: number;
}): Promise<WorkerListResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 20),
  });

  const res = await fetch(`/api/brand/workers?${searchParams}`, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Handle both array and {items} response shapes
  return Array.isArray(data) ? { items: data, total: data.length, page: 1, limit: 20 } : data;
}

export async function inviteWorker(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  cafeId?: string;
}): Promise<WorkerProfile> {
  const res = await fetch('/api/brand/workers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  const response = await res.json();
  return response.user || response;
}

export async function updateWorker(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    cafeId?: string;
  },
): Promise<WorkerProfile> {
  const res = await fetch(`/api/brand/workers/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  const response = await res.json();
  return response.user || response;
}

export async function deleteWorker(id: string): Promise<void> {
  const res = await fetch(`/api/brand/workers/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
}

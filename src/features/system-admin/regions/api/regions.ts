'use client';

import type {
  Region,
  RegionListResponse,
  CreateRegionData,
  UpdateRegionData,
  RegionListQuery,
} from '@/entities/region/types/region';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  try {
    const json = await res.json();
    return formatApiErrorFromText(json.message || 'Unknown error');
  } catch {
    return 'Network error';
  }
}

export async function listRegions(query?: RegionListQuery): Promise<RegionListResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', query.page.toString());
  if (query?.limit) params.set('limit', query.limit.toString());

  const queryString = params.toString();
  const url = `/api/system-admin/regions${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as RegionListResponse;
}

export async function createRegion(data: CreateRegionData): Promise<Region> {
  const res = await fetch('/api/system-admin/regions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Region;
}

export async function getRegion(id: string): Promise<Region> {
  const res = await fetch(`/api/system-admin/regions/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Region;
}

export async function updateRegion(id: string, data: UpdateRegionData): Promise<Region> {
  const res = await fetch(`/api/system-admin/regions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Region;
}

export async function deleteRegion(id: string): Promise<void> {
  const res = await fetch(`/api/system-admin/regions/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error(await readError(res));
}

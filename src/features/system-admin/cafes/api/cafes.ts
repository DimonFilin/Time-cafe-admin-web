'use client';

import type { Cafe, CafeListResponse } from '@/entities/cafe/types/cafe';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export type CafesListParams = {
  brandId?: string;
  regionId?: string;
  city?: string;
  search?: string;
  includeDeleted?: boolean;
  page: number;
  limit: number;
};

export async function listCafes(params: CafesListParams): Promise<CafeListResponse> {
  const qs = new URLSearchParams();
  if (params.brandId) qs.set('brandId', params.brandId);
  if (params.regionId) qs.set('regionId', params.regionId);
  if (params.city) qs.set('city', params.city);
  if (params.search) qs.set('search', params.search);
  if (params.includeDeleted) qs.set('includeDeleted', 'true');
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));

  const res = await fetch(`/api/system-admin/cafes?${qs.toString()}`, { cache: 'no-store' });
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
  brandId: string;
  regionId: string;
  photos?: string[];
  cafeApiUrl?: string;
};

export async function createCafe(input: CreateCafeInput): Promise<Cafe> {
  const res = await fetch('/api/system-admin/cafes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Cafe;
}

export type GeocodeResponse = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  country?: string;
};

export type ReverseGeocodeResponse = {
  formattedAddress: string;
  city?: string;
  country?: string;
  street?: string;
};

export async function geocode(address: string): Promise<GeocodeResponse> {
  const res = await fetch('/api/system-admin/cafes/geocode', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as GeocodeResponse;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResponse> {
  const res = await fetch('/api/system-admin/cafes/reverse-geocode', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ReverseGeocodeResponse;
}

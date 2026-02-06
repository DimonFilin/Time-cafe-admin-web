'use client';

export interface CafeListItem {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  street?: string;
  latitude: number;
  longitude: number;
  photos?: string[];
  rating?: number;
  reviewsCount?: number;
  brandId: string;
  regionId: string;
  cafeApiUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CafeListResponse {
  items: CafeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export async function getCafes(params: {
  page?: number;
  limit?: number;
}): Promise<CafeListResponse> {
  const limit = Math.min(params.limit || 10, 100); // Backend max is 100
  const searchParams = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(limit),
  });

  const res = await fetch(`/api/brand/cafes?${searchParams}`, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Handle both array and {items} response shapes
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: 10 };
  }
  return data;
}

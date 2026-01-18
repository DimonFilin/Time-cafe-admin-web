'use client';

import type { Review, ReviewListResponse } from '@/entities/review/types/review';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listReviews(input: {
  page: number;
  limit: number;
  cafeId?: string;
  minRating?: number;
  verifiedOnly?: boolean;
}): Promise<ReviewListResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(input.page));
  qs.set('limit', String(input.limit));
  if (input.cafeId) qs.set('cafeId', input.cafeId);
  if (input.minRating !== undefined) qs.set('minRating', String(input.minRating));
  if (input.verifiedOnly) qs.set('verifiedOnly', 'true');

  const res = await fetch(`/api/system-admin/reviews?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ReviewListResponse;
}

export async function getReview(id: string): Promise<Review> {
  const res = await fetch(`/api/system-admin/reviews/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Review;
}

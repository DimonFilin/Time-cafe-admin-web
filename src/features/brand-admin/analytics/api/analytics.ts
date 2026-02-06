'use client';

export interface BrandStats {
  totalCafes: number;
  activeCafes: number;
  averageRating: number;
  totalReviews: number;
  totalOrders: number;
  totalRevenue: number;
  cafesByCity: Record<string, number>;
  cafesByRegion: Record<string, number>;
}

export interface BrandOrdersAnalytics {
  totalOrders: number;
  totalRevenue: number;
  periodOrders: number;
  periodRevenue: number;
  dailyTrends: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}

export interface BrandPopularItems {
  popularItems: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  cafePerformance: Array<{
    cafeId: string;
    cafeName: string;
    totalOrders: number;
  }>;
}

export async function getBrandStats(): Promise<BrandStats> {
  const res = await fetch('/api/brand/stats', { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getBrandOrdersAnalytics(): Promise<BrandOrdersAnalytics> {
  const res = await fetch('/api/brand/analytics/orders', { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getBrandPopularItemsAnalytics(): Promise<BrandPopularItems> {
  const res = await fetch('/api/brand/analytics/popular-items', { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  return res.json();
}

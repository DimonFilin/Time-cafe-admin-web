import type { CafeSchedule } from '@/features/cafe-admin/cafe/types/cafe.types';

export type OccupancyMode = 'PERCENT' | 'COUNT';

export type CafeCardVariant = 'brand' | 'system' | 'cafe-admin';

export type CafeCardFormValues = {
  name: string;
  description: string;
  address: string;
  city: string;
  street: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
  brandId: string;
  regionId: string;
  cafeApiUrl: string;
  photosText: string;
  occupancyMode: OccupancyMode;
  schedule: CafeSchedule;
};

export type RegionOption = { id: string; name: string; country: string };
export type BrandOption = { id: string; name: string };

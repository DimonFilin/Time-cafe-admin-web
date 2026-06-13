import type { Cafe } from '@/features/cafe-admin/cafe/types/cafe.types';
import { createDefaultCafeSchedule } from '@/features/cafe-admin/cafe/lib/schedule-map';
import type { CafeCardFormValues } from '../types/cafe-card.types';
import { createEmptyCafeCardValues } from './defaults';

export function cafeToCardValues(cafe: Cafe): CafeCardFormValues {
  return createEmptyCafeCardValues({
    name: cafe.name,
    description: cafe.description ?? '',
    address: cafe.address,
    city: cafe.city,
    street: cafe.street ?? '',
    phone: cafe.phone ?? '',
    email: cafe.email ?? '',
    latitude: String(cafe.latitude ?? 0),
    longitude: String(cafe.longitude ?? 0),
    brandId: cafe.brandId,
    regionId: cafe.regionId,
    cafeApiUrl: cafe.cafeApiUrl ?? '',
    occupancyMode: cafe.occupancyMode ?? 'PERCENT',
    schedule: cafe.schedule ?? createDefaultCafeSchedule(),
  });
}

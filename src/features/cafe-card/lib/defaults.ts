import { createDefaultCafeSchedule } from '@/features/cafe-admin/cafe/lib/schedule-map';
import type { CafeCardFormValues } from '../types/cafe-card.types';

export function createEmptyCafeCardValues(
  partial?: Partial<CafeCardFormValues>,
): CafeCardFormValues {
  return {
    name: '',
    description: '',
    address: '',
    city: '',
    street: '',
    phone: '',
    email: '',
    latitude: '0',
    longitude: '0',
    brandId: '',
    regionId: '',
    cafeApiUrl: '',
    photosText: '',
    occupancyMode: 'PERCENT',
    schedule: createDefaultCafeSchedule(),
    ...partial,
  };
}

import {
  createDefaultCafeSchedule,
  parseOpeningHoursJson,
} from '@/features/cafe-admin/cafe/lib/schedule-map';
import type { CafeCardFormValues, OccupancyMode } from '../types/cafe-card.types';
import { createEmptyCafeCardValues } from './defaults';

export function cafeRecordToCardValues(raw: Record<string, unknown>): CafeCardFormValues {
  const photos = Array.isArray(raw.photos) ? (raw.photos as string[]) : [];
  return createEmptyCafeCardValues({
    name: String(raw.name ?? ''),
    description: raw.description != null ? String(raw.description) : '',
    address: String(raw.address ?? ''),
    city: String(raw.city ?? ''),
    street: raw.street != null ? String(raw.street) : '',
    phone: raw.phone != null ? String(raw.phone) : '',
    email: raw.email != null ? String(raw.email) : '',
    latitude: String(raw.latitude ?? 0),
    longitude: String(raw.longitude ?? 0),
    brandId: String(raw.brandId ?? ''),
    regionId: String(raw.regionId ?? ''),
    cafeApiUrl: raw.cafeApiUrl != null ? String(raw.cafeApiUrl) : '',
    photosText: photos.join('\n'),
    occupancyMode: (raw.occupancyMode as OccupancyMode) ?? 'PERCENT',
    schedule: parseOpeningHoursJson(raw.openingHours) ?? createDefaultCafeSchedule(),
  });
}

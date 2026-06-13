import { cafeScheduleToApiBody } from '@/features/cafe-admin/cafe/lib/schedule-map';
import type { CafeCardFormValues } from '../types/cafe-card.types';

export function cafeCardToApiPayload(values: CafeCardFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    address: values.address.trim(),
    city: values.city.trim(),
    street: values.street.trim() || undefined,
    phone: values.phone.trim() || undefined,
    email: values.email.trim() || undefined,
    latitude: Number(values.latitude) || 0,
    longitude: Number(values.longitude) || 0,
    brandId: values.brandId || undefined,
    regionId: values.regionId || undefined,
    cafeApiUrl: values.cafeApiUrl.trim() || undefined,
    occupancyMode: values.occupancyMode,
    schedule: cafeScheduleToApiBody(values.schedule),
    photos: values.photosText
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
  };
}

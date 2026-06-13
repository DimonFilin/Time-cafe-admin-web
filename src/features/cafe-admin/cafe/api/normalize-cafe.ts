import type { Cafe } from '../types/cafe.types';
import { parseOpeningHoursJson } from '../lib/schedule-map';
import { t } from '@/i18n';

type NestedBrand = { id?: string; name?: string };
type NestedRegion = { id?: string; name?: string };

/** Maps Prisma-shaped cafe (nested brand/region) to flat Cafe for the admin UI. */
export function normalizeCafe(raw: unknown): Cafe {
  if (!raw || typeof raw !== 'object') {
    throw new Error(t('errors.validationError'));
  }
  const o = raw as Record<string, unknown>;
  const brand = o.brand as NestedBrand | undefined;
  const region = o.region as NestedRegion | undefined;
  const ratingVal = o.rating;
  const reviewsVal = o.reviewsCount;
  const chatSettings =
    o.chatSettings && typeof o.chatSettings === 'object'
      ? (o.chatSettings as Record<string, unknown>)
      : undefined;

  return {
    id: String(o.id),
    name: String(o.name),
    description: o.description != null ? String(o.description) : undefined,
    address: String(o.address),
    city: String(o.city),
    street: o.street != null ? String(o.street) : undefined,
    latitude: typeof o.latitude === 'number' ? o.latitude : undefined,
    longitude: typeof o.longitude === 'number' ? o.longitude : undefined,
    photos: Array.isArray(o.photos) ? (o.photos as string[]) : undefined,
    rating: typeof ratingVal === 'number' ? ratingVal : 0,
    reviewsCount: typeof reviewsVal === 'number' ? reviewsVal : 0,
    brandId: String(o.brandId),
    regionId: String(o.regionId),
    brandName: (typeof o.brandName === 'string' && o.brandName) || brand?.name,
    regionName: (typeof o.regionName === 'string' && o.regionName) || region?.name,
    cafeApiUrl: o.cafeApiUrl != null ? String(o.cafeApiUrl) : undefined,
    phone: o.phone != null ? String(o.phone) : undefined,
    email: o.email != null ? String(o.email) : undefined,
    occupancyMode:
      o.occupancyMode === 'COUNT' || o.occupancyMode === 'PERCENT' ? o.occupancyMode : 'PERCENT',
    totalCapacity: typeof o.totalCapacity === 'number' ? o.totalCapacity : undefined,
    schedule: parseOpeningHoursJson(o.openingHours),
    chatSettings: chatSettings
      ? {
          enabled:
            typeof chatSettings.enabled === 'boolean'
              ? (chatSettings.enabled as boolean)
              : undefined,
          notificationMode:
            typeof chatSettings.notificationMode === 'string'
              ? (chatSettings.notificationMode as 'ALL_WORKERS' | 'ROLE_BASED' | 'SPECIFIC_WORKERS')
              : undefined,
          notificationRoles: Array.isArray(chatSettings.notificationRoles)
            ? (chatSettings.notificationRoles as Array<
                'SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER'
              >)
            : undefined,
          notificationWorkerIds: Array.isArray(chatSettings.notificationWorkerIds)
            ? (chatSettings.notificationWorkerIds as string[])
            : undefined,
          theme:
            chatSettings.theme && typeof chatSettings.theme === 'object'
              ? {
                  primaryColor:
                    typeof (chatSettings.theme as Record<string, unknown>).primaryColor === 'string'
                      ? String((chatSettings.theme as Record<string, unknown>).primaryColor)
                      : undefined,
                }
              : undefined,
        }
      : undefined,
    createdAt: String(o.createdAt ?? ''),
    updatedAt: String(o.updatedAt ?? ''),
  };
}

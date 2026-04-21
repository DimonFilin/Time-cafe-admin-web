export interface UpdateCafeDto {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  cafeApiUrl?: string;
  chatEnabled?: boolean;
  chatNotificationMode?: 'ALL_WORKERS' | 'ROLE_BASED' | 'SPECIFIC_WORKERS';
  chatNotificationRoles?: ('SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER')[];
  chatNotificationWorkerIds?: string[];
  chatThemePrimaryColor?: string;
}

export interface DaySchedule {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface CafeSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Cafe {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  rating: number;
  reviewsCount: number;
  brandId: string;
  regionId: string;
  brandName?: string;
  regionName?: string;
  cafeApiUrl?: string;
  /** Parsed from API `openingHours` (weekly hours). */
  schedule?: CafeSchedule;
  chatSettings?: {
    enabled?: boolean;
    notificationMode?: 'ALL_WORKERS' | 'ROLE_BASED' | 'SPECIFIC_WORKERS';
    notificationRoles?: ('SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER')[];
    notificationWorkerIds?: string[];
    theme?: {
      primaryColor?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

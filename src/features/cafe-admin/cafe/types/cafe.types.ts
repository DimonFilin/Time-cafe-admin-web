export interface Cafe {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  brandId: string;
  regionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCafeDto {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
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

export interface UpdateCafeScheduleDto {
  schedule: CafeSchedule;
}

export interface WorkerWithRelations {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  cafeId: string | null;
  brandId: string;
  shiftStatus: 'ON_SHIFT' | 'OFF_SHIFT';
  cafe?: {
    id: string;
    name: string;
  } | null;
  brand?: {
    id: string;
    name: string;
  };
}

export interface WorkerMeScheduleEffectiveSegment {
  startIso: string;
  endIso: string;
  startDateMsk: string;
  open: string;
  close: string;
  source: 'WORKER' | 'CAFE';
}

export interface WorkerMeSchedule {
  todayMsk: string;
  cafeScheduleStatus: 'SET' | 'NOT_SET';
  cafe: { id: string; name: string } | null;
  shiftSchedule: unknown;
  absences: Array<{ id: string; startDate: string; endDate: string; kind: string }>;
  effectiveSegments: WorkerMeScheduleEffectiveSegment[];
}

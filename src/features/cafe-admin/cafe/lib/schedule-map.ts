import type { CafeSchedule, DaySchedule } from '../types/cafe.types';

export const SCHEDULE_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type ScheduleDayKey = (typeof SCHEDULE_DAYS)[number];

export const SCHEDULE_DAY_LABELS: Record<ScheduleDayKey, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье',
};

const DEFAULT_DAY: DaySchedule = {
  open: '09:00',
  close: '18:00',
  isClosed: false,
};

/** Default editor state (Sunday closed). */
export function createDefaultCafeSchedule(): CafeSchedule {
  return {
    monday: { ...DEFAULT_DAY },
    tuesday: { ...DEFAULT_DAY },
    wednesday: { ...DEFAULT_DAY },
    thursday: { ...DEFAULT_DAY },
    friday: { ...DEFAULT_DAY },
    saturday: { ...DEFAULT_DAY },
    sunday: { ...DEFAULT_DAY, isClosed: true },
  };
}

type StoredDay = { open?: string; close?: string; closed?: boolean };

/** Body for PATCH /cafe-admin/cafe/my/schedule (flat days, `closed` not `isClosed`). */
export function cafeScheduleToApiBody(
  schedule: CafeSchedule,
): Record<ScheduleDayKey, { open: string; close: string; closed: boolean }> {
  return Object.fromEntries(
    SCHEDULE_DAYS.map((day) => {
      const d = schedule[day];
      return [
        day,
        {
          open: d.open,
          close: d.close,
          closed: d.isClosed,
        },
      ];
    }),
  ) as Record<ScheduleDayKey, { open: string; close: string; closed: boolean }>;
}

export function parseOpeningHoursJson(raw: unknown): CafeSchedule | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, StoredDay>;
  const hasAny = SCHEDULE_DAYS.some((d) => o[d] != null && typeof o[d] === 'object');
  if (!hasAny) return undefined;

  const result = {} as CafeSchedule;
  for (const day of SCHEDULE_DAYS) {
    const v = o[day];
    if (!v || typeof v !== 'object') {
      result[day] = { ...DEFAULT_DAY };
      continue;
    }
    result[day] = {
      open: typeof v.open === 'string' ? v.open : DEFAULT_DAY.open,
      close: typeof v.close === 'string' ? v.close : DEFAULT_DAY.close,
      isClosed: v.closed === true,
    };
  }
  return result;
}

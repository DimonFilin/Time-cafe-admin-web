import type { WorkerMeSchedule, WorkerMeScheduleEffectiveSegment } from '../types/worker.types';

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  monday: 'Пн',
  tuesday: 'Вт',
  wednesday: 'Ср',
  thursday: 'Чт',
  friday: 'Пт',
  saturday: 'Сб',
  sunday: 'Вс',
};

type ShiftSeg = { open: string; close: string };

export type WorkerTemplateDay = {
  key: (typeof DAY_KEYS)[number];
  label: string;
  text: string;
};

function parseTemplate(shiftSchedule: unknown): WorkerTemplateDay[] {
  if (!shiftSchedule || typeof shiftSchedule !== 'object') {
    return DAY_KEYS.map((key) => ({ key, label: DAY_LABELS[key], text: '—' }));
  }
  const o = shiftSchedule as Record<string, unknown>;
  return DAY_KEYS.map((key) => {
    const v = o[key];
    if (!v || typeof v !== 'object') {
      return { key, label: DAY_LABELS[key], text: '—' };
    }
    const r = v as Record<string, unknown>;
    if (r.closed === true) {
      return { key, label: DAY_LABELS[key], text: 'Выходной' };
    }
    const segs: ShiftSeg[] = [];
    if (Array.isArray(r.segments)) {
      for (const s of r.segments) {
        if (s && typeof s === 'object') {
          const z = s as Record<string, unknown>;
          if (typeof z.open === 'string' && typeof z.close === 'string') {
            segs.push({ open: z.open, close: z.close });
          }
        }
      }
    } else if (typeof r.open === 'string' && typeof r.close === 'string') {
      segs.push({ open: r.open, close: r.close });
    }
    if (!segs.length) {
      return { key, label: DAY_LABELS[key], text: '—' };
    }
    return {
      key,
      label: DAY_LABELS[key],
      text: segs.map((s) => `${s.open}–${s.close}`).join(', '),
    };
  });
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function weekdayLabelFromYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const jsDay = dt.getUTCDay();
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_LABELS[DAY_KEYS[idx]];
}

function weekdayKeyFromYmd(ymd: string): (typeof DAY_KEYS)[number] {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const jsDay = dt.getUTCDay();
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_KEYS[idx];
}

function segmentsForDate(
  schedule: WorkerMeSchedule,
  ymd: string,
): WorkerMeScheduleEffectiveSegment[] {
  return schedule.effectiveSegments.filter((s) => s.startDateMsk === ymd);
}

function formatSegmentsBrief(segs: WorkerMeScheduleEffectiveSegment[]): string {
  if (!segs.length) return '—';
  return segs.map((s) => `${s.open}–${s.close}`).join(', ');
}

/** Latest end time today (HH:mm) across effective segments, or null. */
export function todayWorkUntil(schedule: WorkerMeSchedule): string | null {
  const segs = segmentsForDate(schedule, schedule.todayMsk);
  if (!segs.length) return null;
  let max = segs[0].close;
  for (const s of segs) {
    if (s.close > max) max = s.close;
  }
  return max;
}

export function todayWorkSummary(schedule: WorkerMeSchedule): string {
  const segs = segmentsForDate(schedule, schedule.todayMsk);
  return formatSegmentsBrief(segs);
}

export type WeekDayRow = {
  ymd: string;
  label: string;
  summary: string;
  isToday: boolean;
};

export function weekScheduleRows(schedule: WorkerMeSchedule, days = 7): WeekDayRow[] {
  const rows: WeekDayRow[] = [];
  for (let i = 0; i < days; i++) {
    const ymd = addDaysYmd(schedule.todayMsk, i);
    const weekday = weekdayLabelFromYmd(ymd);
    const segs = segmentsForDate(schedule, ymd);
    rows.push({
      ymd,
      label: `${weekday} ${ymd.slice(8, 10)}.${ymd.slice(5, 7)}`,
      summary: formatSegmentsBrief(segs),
      isToday: ymd === schedule.todayMsk,
    });
  }
  return rows;
}

export function workerTemplateDays(schedule: WorkerMeSchedule): WorkerTemplateDay[] {
  return parseTemplate(schedule.shiftSchedule);
}

export function isWorkerTemplateEmpty(schedule: WorkerMeSchedule): boolean {
  return workerTemplateDays(schedule).every((d) => d.text === '—');
}

/** Segments for shift confirm: today + overnight shift that started yesterday. */
export function segmentsForConfirmDialog(
  schedule: WorkerMeSchedule,
): WorkerMeScheduleEffectiveSegment[] {
  const today = schedule.todayMsk;
  const yesterday = addDaysYmd(today, -1);
  const seen = new Set<string>();
  const out: WorkerMeScheduleEffectiveSegment[] = [];

  for (const seg of schedule.effectiveSegments) {
    const overnightFromYesterday = seg.startDateMsk === yesterday && seg.close <= seg.open;
    if (seg.startDateMsk !== today && !overnightFromYesterday) continue;
    const key = `${seg.startIso}|${seg.endIso}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(seg);
  }

  return out.sort((a, b) => a.open.localeCompare(b.open));
}

export function formatScheduleLinesForConfirm(
  schedule: WorkerMeSchedule,
  labels: { cafe: string; worker: string; dayOff: string },
): string {
  const src = (source: 'WORKER' | 'CAFE') => (source === 'CAFE' ? labels.cafe : labels.worker);

  const segs = segmentsForConfirmDialog(schedule);
  if (segs.length) {
    return segs.map((seg) => `${seg.open}–${seg.close} (${src(seg.source)})`).join('\n');
  }

  const wd = weekdayKeyFromYmd(schedule.todayMsk);
  const dayRow = workerTemplateDays(schedule).find((d) => d.key === wd);
  if (dayRow?.text === 'Выходной') return labels.dayOff;
  if (dayRow && dayRow.text !== '—') {
    return `${dayRow.text} (${labels.worker})`;
  }

  return '';
}

'use client';

import type { CafeSchedule, DaySchedule } from '@/features/cafe-admin/cafe/types/cafe.types';
import {
  SCHEDULE_DAYS,
  SCHEDULE_DAY_LABELS,
  type ScheduleDayKey,
} from '@/features/cafe-admin/cafe/lib/schedule-map';
import { Input } from '@/shared/ui/input/Input';

const labelClass = 'mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]';

export function CafeScheduleFields({
  schedule,
  onChange,
  readOnly = false,
}: {
  schedule: CafeSchedule;
  onChange?: (schedule: CafeSchedule) => void;
  readOnly?: boolean;
}) {
  const updateDay = <K extends keyof DaySchedule>(
    day: ScheduleDayKey,
    field: K,
    value: DaySchedule[K],
  ) => {
    if (!onChange || readOnly) return;
    onChange({
      ...schedule,
      [day]: { ...schedule[day], [field]: value },
    });
  };

  return (
    <div className="space-y-3">
      {SCHEDULE_DAYS.map((day) => (
        <div
          key={day}
          className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[rgb(var(--tc-fg))]">
              {SCHEDULE_DAY_LABELS[day]}
            </span>
            {!readOnly ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[rgb(var(--tc-muted))]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[rgb(var(--tc-border))]"
                  checked={schedule[day].isClosed}
                  onChange={(e) => updateDay(day, 'isClosed', e.target.checked)}
                />
                Закрыто
              </label>
            ) : (
              <span className="text-xs text-[rgb(var(--tc-muted))]">
                {schedule[day].isClosed ? 'Закрыто' : 'Открыто'}
              </span>
            )}
          </div>

          {!schedule[day].isClosed ? (
            readOnly ? (
              <p className="text-sm text-[rgb(var(--tc-muted))]">
                {schedule[day].open} – {schedule[day].close}
              </p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[120px] flex-1">
                  <label className={labelClass} htmlFor={`${day}-open`}>
                    Открытие
                  </label>
                  <Input
                    id={`${day}-open`}
                    type="time"
                    value={schedule[day].open}
                    onChange={(e) => updateDay(day, 'open', e.target.value)}
                    required
                  />
                </div>
                <span className="hidden pb-2 text-[rgb(var(--tc-muted))] sm:inline">—</span>
                <div className="min-w-[120px] flex-1">
                  <label className={labelClass} htmlFor={`${day}-close`}>
                    Закрытие
                  </label>
                  <Input
                    id={`${day}-close`}
                    type="time"
                    value={schedule[day].close}
                    onChange={(e) => updateDay(day, 'close', e.target.value)}
                    required
                  />
                </div>
              </div>
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}

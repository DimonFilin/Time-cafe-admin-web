'use client';

import { useState } from 'react';
import { t } from '@/i18n';
import type { WorkerMeSchedule } from '../types/worker.types';
import { todayWorkSummary, todayWorkUntil } from '../lib/schedule-display';
import { WorkerScheduleCard } from './WorkerScheduleCard';

type Props = {
  schedule: WorkerMeSchedule | null;
  loading: boolean;
  error: string | null;
};

export function WorkerSidebarSchedule({ schedule, loading, error }: Props) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <p className="text-xs text-[rgb(var(--tc-muted))]">{t('worker.schedule.loadingShort')}</p>
    );
  }
  if (error) {
    return (
      <p className="text-xs text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (!schedule) return null;

  const until = todayWorkUntil(schedule);
  const summary = todayWorkSummary(schedule);

  return (
    <div className="mt-2 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))]/40 p-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left text-xs text-[rgb(var(--tc-fg))]"
        aria-expanded={open}
      >
        <span>
          <span className="block font-semibold">{t('worker.schedule.todayShift')}</span>
          <span className="mt-0.5 block text-[rgb(var(--tc-muted))]">
            {until
              ? `${summary} · ${t('worker.schedule.todayUntil')} ${until}`
              : summary === '—'
                ? t('worker.dashboard.cafeNoSegmentsToday')
                : summary}
          </span>
        </span>
        <span className="shrink-0 pt-0.5 text-[rgb(var(--tc-muted))]" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="mt-2 border-t border-[rgb(var(--tc-border))] pt-2">
          <WorkerScheduleCard schedule={schedule} compact />
        </div>
      )}
    </div>
  );
}

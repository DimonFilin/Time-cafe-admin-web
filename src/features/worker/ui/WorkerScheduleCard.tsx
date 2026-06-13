'use client';

import { t } from '@/i18n';
import type { WorkerMeSchedule } from '../types/worker.types';
import {
  isWorkerTemplateEmpty,
  todayWorkSummary,
  todayWorkUntil,
  weekScheduleRows,
  workerTemplateDays,
} from '../lib/schedule-display';

type Props = {
  schedule: WorkerMeSchedule | null;
  loading?: boolean;
  error?: string | null;
  cafeName?: string | null;
  compact?: boolean;
};

export function WorkerScheduleCard({ schedule, loading, error, cafeName, compact }: Props) {
  if (loading) {
    return <p className="text-sm text-[rgb(var(--tc-muted))]">{t('common.loading')}</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (!schedule) {
    return <p className="text-sm text-[rgb(var(--tc-muted))]">—</p>;
  }

  const template = workerTemplateDays(schedule);
  const week = weekScheduleRows(schedule);
  const until = todayWorkUntil(schedule);
  const todaySummary = todayWorkSummary(schedule);

  if (compact) {
    return (
      <div className="space-y-1 text-xs">
        <div className="font-medium text-[rgb(var(--tc-fg))]">
          {until
            ? `${t('worker.schedule.todayUntil')} ${until}`
            : `${t('worker.schedule.today')}: ${todaySummary}`}
        </div>
        <ul className="space-y-0.5 text-[rgb(var(--tc-muted))]">
          {week.map((row) => (
            <li key={row.ymd} className={row.isToday ? 'text-[rgb(var(--tc-fg))]' : undefined}>
              <span className="font-medium">{row.label}:</span> {row.summary}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))]/50 p-4">
        <h4 className="mb-2 text-sm font-semibold">{t('worker.schedule.todayEffective')}</h4>
        <p className="text-sm text-[rgb(var(--tc-fg))]">
          {until ? (
            <>
              {todaySummary}
              <span className="ml-2 text-[rgb(var(--tc-muted))]">
                ({t('worker.schedule.todayUntil')} {until})
              </span>
            </>
          ) : (
            <span className="text-[rgb(var(--tc-muted))]">
              {t('worker.dashboard.cafeNoSegmentsToday')}
            </span>
          )}
        </p>
        {schedule.cafeScheduleStatus === 'NOT_SET' && (
          <p className="mt-2 text-xs text-[rgb(var(--tc-muted))]">
            {t('worker.dashboard.cafeScheduleNotSet')}
          </p>
        )}
        {cafeName && schedule.cafeScheduleStatus !== 'NOT_SET' && (
          <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {cafeName} — {t('worker.schedule.cafeHoursHint')}
          </p>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">{t('worker.schedule.weekEffective')}</h4>
        <ul className="divide-y divide-[rgb(var(--tc-border))] rounded-lg border border-[rgb(var(--tc-border))] text-sm">
          {week.map((row) => (
            <li
              key={row.ymd}
              className={`flex justify-between gap-3 px-3 py-2 ${
                row.isToday ? 'bg-[rgb(var(--tc-accent))]/10 font-medium' : ''
              }`}
            >
              <span>{row.label}</span>
              <span className="text-right text-[rgb(var(--tc-muted))]">{row.summary}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">{t('worker.schedule.myTemplate')}</h4>
        {isWorkerTemplateEmpty(schedule) ? (
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {t('worker.schedule.templateEmpty')}
          </p>
        ) : (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {template.map((d) => (
              <li
                key={d.key}
                className="flex justify-between gap-2 rounded-md border border-[rgb(var(--tc-border))] px-2 py-1"
              >
                <span className="font-medium">{d.label}</span>
                <span className="text-[rgb(var(--tc-muted))]">{d.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {schedule.absences.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">{t('worker.schedule.absences')}</h4>
          <ul className="space-y-1 text-sm text-[rgb(var(--tc-muted))]">
            {schedule.absences.map((a) => (
              <li key={a.id}>
                {a.startDate.slice(0, 10)} — {a.endDate.slice(0, 10)} ({a.kind})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

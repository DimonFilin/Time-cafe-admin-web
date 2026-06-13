'use client';

import { useEffect, useState } from 'react';
import type { CafeSchedule } from '@/features/cafe-admin/cafe/types/cafe.types';
import type { CafeCardFormValues, OccupancyMode } from '../types/cafe-card.types';
import { CafeScheduleFields } from './CafeScheduleFields';

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function subDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - days);
  return copy;
}

const labelClass = 'mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]';
const fieldClass =
  'w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm';

type OccupancySummary = {
  totalCapacity: number;
  avgLabel: string;
  loading: boolean;
};

export function CafeAdditionalTabFields({
  values,
  onChange,
  cafeId,
  readOnly = false,
}: {
  values: CafeCardFormValues;
  onChange: (patch: Partial<CafeCardFormValues>) => void;
  cafeId?: string;
  readOnly?: boolean;
}) {
  const [summary, setSummary] = useState<OccupancySummary>({
    totalCapacity: 0,
    avgLabel: '—',
    loading: false,
  });

  useEffect(() => {
    if (!cafeId) return;
    let cancelled = false;
    const load = async () => {
      setSummary((s) => ({ ...s, loading: true }));
      try {
        const to = formatYmd(new Date());
        const from = formatYmd(subDays(new Date(), 6));
        const res = await fetch(
          `/api/cafe-layout/cafes/${cafeId}/occupancy?from=${from}&to=${to}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const days = Array.isArray(json.days) ? json.days : [];
        const cap = days[0]?.totalCapacity ?? 0;
        const mode = (json.occupancyMode as OccupancyMode) ?? values.occupancyMode;
        let avgLabel = '—';
        if (mode === 'COUNT' && json.summary?.avgOccupied != null) {
          avgLabel = `${json.summary.avgOccupied} броней/день (ср.)`;
        } else if (json.summary?.avgOccupancyPercent != null) {
          avgLabel = `${json.summary.avgOccupancyPercent}% (ср. за 7 дней)`;
        }
        setSummary({ totalCapacity: cap, avgLabel, loading: false });
      } catch {
        if (!cancelled) setSummary((s) => ({ ...s, loading: false }));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [cafeId, values.occupancyMode]);

  const onScheduleChange = (schedule: CafeSchedule) => onChange({ schedule });

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-2 text-sm font-semibold">Режим работы</h4>
        <CafeScheduleFields
          schedule={values.schedule}
          onChange={readOnly ? undefined : onScheduleChange}
          readOnly={readOnly}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Отображение загрузки</label>
          {readOnly ? (
            <p className="text-sm">
              {values.occupancyMode === 'COUNT' ? 'Количество посетителей' : 'Процент загрузки'}
            </p>
          ) : (
            <select
              className={fieldClass}
              value={values.occupancyMode}
              onChange={(e) => onChange({ occupancyMode: e.target.value as OccupancyMode })}
            >
              <option value="PERCENT">Процент загрузки</option>
              <option value="COUNT">Количество броней / вместимость</option>
            </select>
          )}
        </div>

        {cafeId ? (
          <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4 text-sm">
            <p className="font-medium">Вместимость заведения</p>
            <p className="mt-1 text-[rgb(var(--tc-muted))]">
              {summary.loading
                ? 'Загрузка…'
                : `${summary.totalCapacity} чел. (сумма ACTIVE-комнат)`}
            </p>
            <p className="mt-2 font-medium">Средняя загрузка</p>
            <p className="mt-1 text-[rgb(var(--tc-muted))]">
              {summary.loading ? 'Загрузка…' : summary.avgLabel}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            Вместимость и статистика загрузки доступны после сохранения кафе.
          </p>
        )}
      </section>
    </div>
  );
}

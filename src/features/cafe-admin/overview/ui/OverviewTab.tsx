'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';
import { t } from '@/i18n';
import { getMyCafe } from '../../cafe/api/cafe-api';
import type { Cafe } from '../../cafe/types/cafe.types';

function switchTab(tab: string, extra?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('cafeAdminSwitchTab', { detail: { tab, ...extra } }));
}

const todayYmd = () => new Date().toISOString().slice(0, 10);

interface OverviewStats {
  activeWorkers: number;
  totalWorkers: number;
  tasksToday: number;
  completedTasks: number;
}

export function OverviewTab() {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [occDate, setOccDate] = useState(todayYmd);
  const [occTo, setOccTo] = useState(todayYmd);
  const [occRange, setOccRange] = useState(false);
  const [occData, setOccData] = useState<Record<string, unknown> | null>(null);
  const [occLoading, setOccLoading] = useState(false);
  const [occErr, setOccErr] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cafeData = await getMyCafe();
        setCafe(cafeData);

        // TODO: Fetch real stats from API
        setStats({
          activeWorkers: 0,
          totalWorkers: 0,
          tasksToday: 0,
          completedTasks: 0,
        });
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!cafe?.id) return;
    let cancelled = false;
    (async () => {
      setOccLoading(true);
      setOccErr(null);
      try {
        const qs = occRange
          ? `from=${encodeURIComponent(occDate)}&to=${encodeURIComponent(occTo)}`
          : `date=${encodeURIComponent(occDate)}`;
        const res = await fetch(`/api/cafe-layout/cafes/${cafe.id}/occupancy?${qs}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const j = await res.json();
        if (!res.ok) throw new Error((j as { message?: string })?.message || 'Ошибка загрузки');
        if (!cancelled) setOccData(j as Record<string, unknown>);
      } catch (e) {
        if (!cancelled) setOccErr(e instanceof Error ? e.message : 'Ошибка');
      } finally {
        if (!cancelled) setOccLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cafe?.id, occDate, occTo, occRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-[rgb(var(--tc-muted))]">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cafe Header */}
      {cafe && (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{cafe.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-[rgb(var(--tc-muted))]">
                <span>
                  📍 {cafe.address}, {cafe.city}
                </span>
                <span>⭐ {cafe.rating.toFixed(1)}</span>
                <span>
                  🧾 {cafe.reviewsCount} {t('cafeAdmin.overview.reviews')}
                </span>
                {cafe.regionName ? <span>🗺️ {cafe.regionName}</span> : null}
                {cafe.cafeApiUrl ? <span>🔗 {t('cafeAdmin.overview.apiConnected')}</span> : null}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t('cafeAdmin.overview.title')}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
          {t('cafeAdmin.overview.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.overview.activeWorkers')}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats?.activeWorkers || 0}</div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.overview.totalWorkers')}: {stats?.totalWorkers || 0}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.overview.tasksToday')}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats?.tasksToday || 0}</div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {stats?.completedTasks || 0} {t('cafeAdmin.overview.completedTasks')}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.overview.ordersToday')}
          </div>
          <div className="mt-2 text-2xl font-bold">0</div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.overview.comingSoon')}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.overview.revenueToday')}
          </div>
          <div className="mt-2 text-2xl font-bold">
            <MoneyAmount value={0} iconClassName="h-[1.15em] w-[0.95em]" />
          </div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.overview.comingSoon')}
          </div>
        </Card>
      </div>

      {cafe && (
        <Card className="p-6">
          <h3 className="mb-2 text-lg font-semibold">Загрузка по записям</h3>
          <p className="mb-3 text-sm text-[rgb(var(--tc-muted))]">
            Процент от вместимости активных комнат. Для диапазона — среднее арифметическое дневных
            процентов (до 31 дня).
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={occRange}
              onChange={(e) => setOccRange(e.target.checked)}
              className="rounded border-[rgb(var(--tc-border))]"
            />
            Диапазон дат
          </label>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                {occRange ? 'С даты' : 'Дата'}
              </label>
              <input
                type="date"
                value={occDate}
                onChange={(e) => setOccDate(e.target.value)}
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
              />
            </div>
            {occRange && (
              <div>
                <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">По дату</label>
                <input
                  type="date"
                  value={occTo}
                  onChange={(e) => setOccTo(e.target.value)}
                  className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                />
              </div>
            )}
          </div>
          {occLoading && (
            <p className="mt-3 text-sm text-[rgb(var(--tc-muted))]">Загрузка показателей...</p>
          )}
          {occErr && <p className="mt-3 text-sm text-red-600">{occErr}</p>}
          {occData && !occLoading && (
            <div className="mt-4 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-1))]/40 p-4">
              {occData.mode === 'range' ? (
                <>
                  <div className="text-3xl font-bold tabular-nums">
                    {(occData.summary as { avgOccupancyPercent?: number })?.avgOccupancyPercent ??
                      '—'}
                    %
                  </div>
                  <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                    Среднее за {(occData.summary as { dayCount?: number })?.dayCount ?? 0} дн. (
                    {String(occData.from)} — {String(occData.to)})
                  </p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold tabular-nums">
                    {Number(occData.occupancyPercent ?? 0)}%
                  </div>
                  <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                    Записей: {Number(occData.totalAppointments ?? 0)}, вместимость:{' '}
                    {Number(occData.totalCapacity ?? 0)} чел. ({String(occData.date)})
                  </p>
                </>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">{t('cafeAdmin.overview.quickActions')}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => switchTab('workers', { openInvite: true })}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('cafeAdmin.overview.inviteWorker')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.overview.inviteWorkerDesc')}
            </div>
          </button>
          <button
            onClick={() => switchTab('tasks', { openCreate: true })}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('cafeAdmin.overview.createTask')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.overview.createTaskDesc')}
            </div>
          </button>
          <button
            onClick={() => switchTab('activity-logs')}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('cafeAdmin.overview.viewActivityLogs')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.overview.viewActivityLogsDesc')}
            </div>
          </button>
          <button
            onClick={() => switchTab('workers')}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('cafeAdmin.overview.manageWorkers')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.overview.manageWorkersDesc')}
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}

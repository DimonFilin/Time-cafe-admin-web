'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Badge } from '@/shared/ui/badge/Badge';
import { Button } from '@/shared/ui/button/Button';
import { BrandEditModal } from './BrandEditModal';
import { MediaImage } from '@/shared/ui/media/MediaImage';
import { t } from '@/i18n';

interface Brand {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  isVerified: boolean;
}

interface BrandStats {
  cafesCount: number;
  workersCount: number;
  ordersCount: number;
  reviewsAverage: number;
}

export function BrandOverviewTab() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const occToday = () => new Date().toISOString().slice(0, 10);
  const [occCafes, setOccCafes] = useState<Array<{ id: string; name: string }>>([]);
  const [occCafeId, setOccCafeId] = useState<string>('all');
  const [occDate, setOccDate] = useState(occToday);
  const [occTo, setOccTo] = useState(occToday);
  const [occRange, setOccRange] = useState(false);
  const [occRows, setOccRows] = useState<
    Array<{ id: string; name: string; pct: number | null; err?: string }>
  >([]);
  const [occLoading, setOccLoading] = useState(false);
  const [occErr, setOccErr] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandData();
  }, []);

  useEffect(() => {
    if (!brand) return;
    (async () => {
      try {
        const r = await fetch('/api/brand/cafes?page=1&limit=100', { credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        const items = (j.items || []) as Array<{ id: string; name?: string }>;
        setOccCafes(items.map((x) => ({ id: x.id, name: x.name || x.id })));
      } catch {
        setOccCafes([]);
      }
    })();
  }, [brand?.id]);

  useEffect(() => {
    if (!brand || occCafes.length === 0) return;
    let cancelled = false;
    (async () => {
      setOccLoading(true);
      setOccErr(null);
      try {
        const q = occRange
          ? `from=${encodeURIComponent(occDate)}&to=${encodeURIComponent(occTo)}`
          : `date=${encodeURIComponent(occDate)}`;
        const targets = occCafeId === 'all' ? occCafes : occCafes.filter((c) => c.id === occCafeId);
        if (!targets.length) {
          if (!cancelled) {
            setOccRows([]);
            setOccLoading(false);
          }
          return;
        }
        const settled = await Promise.all(
          targets.map(async (c) => {
            const res = await fetch(`/api/cafe-layout/cafes/${c.id}/occupancy?${q}`, {
              credentials: 'include',
              cache: 'no-store',
            });
            const j = (await res.json()) as Record<string, unknown>;
            if (!res.ok) {
              return {
                id: c.id,
                name: c.name,
                pct: null,
                err: String(j.message || j.error || res.status),
              };
            }
            const pct =
              j.mode === 'range' && j.summary
                ? (j.summary as { avgOccupancyPercent: number }).avgOccupancyPercent
                : typeof j.occupancyPercent === 'number'
                  ? j.occupancyPercent
                  : null;
            return { id: c.id, name: c.name, pct, err: undefined };
          }),
        );
        if (!cancelled) setOccRows(settled);
      } catch (e) {
        if (!cancelled) setOccErr(e instanceof Error ? e.message : 'Ошибка');
      } finally {
        if (!cancelled) setOccLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand?.id, occCafes, occCafeId, occDate, occTo, occRange]);

  const fetchBrandData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch brand info from API proxy
      const brandRes = await fetch('/api/brand');
      if (!brandRes.ok) throw new Error(t('brandAdmin.modals.fetchBrandFailed'));
      const brandData = await brandRes.json();
      setBrand(brandData);

      // Fetch stats from API proxy
      const statsRes = await fetch('/api/brand/stats');
      if (!statsRes.ok) throw new Error(t('brandAdmin.modals.fetchStatsFailed'));
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrand = async (updatedData: Partial<Brand>) => {
    try {
      const response = await fetch(`/api/brand`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[BrandOverviewTab] Update error:', {
          status: response.status,
          error: errorData,
        });
        throw new Error(
          errorData.message || errorData.details || t('brandAdmin.modals.updateBrandFailed'),
        );
      }

      const updatedBrand = await response.json();
      setBrand(updatedBrand);
      setEditOpen(false);
    } catch (err) {
      console.error('[BrandOverviewTab] Save error:', err);
      throw err;
    }
  };

  const getStatusColor = (
    status: string,
  ): 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500' | 'bg-gray-500' => {
    const colors: {
      [key: string]: 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500' | 'bg-gray-500';
    } = {
      ACTIVE: 'bg-green-500',
      PENDING: 'bg-yellow-500',
      SUSPENDED: 'bg-red-500',
      REJECTED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[rgb(var(--tc-border))]" />
        <div className="h-48 animate-pulse rounded bg-[rgb(var(--tc-border))]" />
      </div>
    );
  }

  // Error state
  if (error || !brand) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('brandAdmin.overview.title')}</h2>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-500">{error || t('errors.unknown')}</p>
            <Button onClick={fetchBrandData} className="mt-4">
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('brandAdmin.overview.title')}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.overview.subtitle')}
          </p>
        </div>
        <Button onClick={() => setEditOpen(true)} variant="secondary">
          {t('brandAdmin.overview.editProfile')}
        </Button>
      </div>

      {/* Brand Profile Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header with Logo and Name */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {brand.logo ? (
                <MediaImage src={brand.logo} alt={brand.name} variant="tileMd" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[rgb(var(--tc-accent))]">
                  <span className="text-2xl font-bold text-white">{brand.name[0]}</span>
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{brand.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={`${getStatusColor(brand.status)} text-white`}>
                    {brand.status}
                  </Badge>
                  {brand.isVerified && (
                    <Badge className="bg-blue-500 text-white">
                      {t('brandAdmin.overview.verified')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {brand.description && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">
                {t('common.description')}
              </h4>
              <p className="mt-1 text-sm">{brand.description}</p>
            </div>
          )}

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brand.email && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">
                  {t('common.email')}
                </h4>
                <p className="mt-1 text-sm">
                  <a
                    href={`mailto:${brand.email}`}
                    className="text-[rgb(var(--tc-accent))] hover:underline"
                  >
                    {brand.email}
                  </a>
                </p>
              </div>
            )}
            {brand.phone && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">
                  {t('common.phone')}
                </h4>
                <p className="mt-1 text-sm">
                  <a
                    href={`tel:${brand.phone}`}
                    className="text-[rgb(var(--tc-accent))] hover:underline"
                  >
                    {brand.phone}
                  </a>
                </p>
              </div>
            )}
            {brand.website && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">
                  {t('common.website')}
                </h4>
                <p className="mt-1 text-sm">
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[rgb(var(--tc-accent))] hover:underline"
                  >
                    {brand.website}
                  </a>
                </p>
              </div>
            )}
            {brand.address && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">
                  {t('common.address')}
                </h4>
                <p className="mt-1 text-sm">{brand.address}</p>
              </div>
            )}
            {brand.primaryColor && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">
                  {t('brandAdmin.settings.primaryColor')}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border border-[rgb(var(--tc-border))]"
                    style={{ backgroundColor: brand.primaryColor }}
                  />
                  <code className="text-xs text-[rgb(var(--tc-muted))]">{brand.primaryColor}</code>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            aria-label={t('brandAdmin.overview.cafesCount')}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('brandAdminSwitchTab', { detail: { tab: 'cafes' } }),
              )
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-4 text-center transition-colors hover:bg-[rgb(var(--tc-surface-2))] cursor-pointer"
          >
            <div className="text-3xl font-bold text-[rgb(var(--tc-accent))]">
              {stats.cafesCount}
            </div>
            <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.overview.cafesCount')}
            </p>
          </button>
          <button
            type="button"
            aria-label={t('brandAdmin.overview.workersCount')}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('brandAdminSwitchTab', { detail: { tab: 'workers' } }),
              )
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-4 text-center transition-colors hover:bg-[rgb(var(--tc-surface-2))] cursor-pointer"
          >
            <div className="text-3xl font-bold text-[rgb(var(--tc-accent))]">
              {stats.workersCount}
            </div>
            <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.overview.workersCount')}
            </p>
          </button>
          <button
            type="button"
            aria-label={t('brandAdmin.overview.ordersCount')}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('brandAdminSwitchTab', { detail: { tab: 'analytics' } }),
              )
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-4 text-center transition-colors hover:bg-[rgb(var(--tc-surface-2))] cursor-pointer"
          >
            <div className="text-3xl font-bold text-[rgb(var(--tc-accent))]">
              {stats.ordersCount}
            </div>
            <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.overview.ordersCount')}
            </p>
          </button>
        </div>
      )}

      <Card className="p-6">
        <h3 className="mb-2 text-lg font-semibold">Загрузка по записям (кафе)</h3>
        <p className="mb-3 text-sm text-[rgb(var(--tc-muted))]">
          Выберите кафе или все сразу. Для диапазона — среднее дневных процентов (до 31 дня).
        </p>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Кафе</label>
            <select
              value={occCafeId}
              onChange={(e) => setOccCafeId(e.target.value)}
              className="min-w-[12rem] rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
            >
              <option value="all">Все кафе</option>
              {occCafes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={occRange}
              onChange={(e) => setOccRange(e.target.checked)}
              className="rounded border-[rgb(var(--tc-border))]"
            />
            Диапазон
          </label>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
              {occRange ? 'С' : 'Дата'}
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
              <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">По</label>
              <input
                type="date"
                value={occTo}
                onChange={(e) => setOccTo(e.target.value)}
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
              />
            </div>
          )}
        </div>
        {occLoading && <p className="text-sm text-[rgb(var(--tc-muted))]">Загрузка...</p>}
        {occErr && <p className="text-sm text-red-600">{occErr}</p>}
        {!occLoading && occRows.length > 0 && (
          <ul className="mt-2 divide-y divide-[rgb(var(--tc-border))] rounded-lg border border-[rgb(var(--tc-border))]">
            {occRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="font-medium">{row.name}</span>
                <span className="tabular-nums text-[rgb(var(--tc-muted))]">
                  {row.err ? (
                    <span className="text-red-600">{row.err}</span>
                  ) : row.pct != null ? (
                    <span className="text-lg font-semibold text-[rgb(var(--tc-fg))]">
                      {row.pct}%
                    </span>
                  ) : (
                    '—'
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Edit Modal */}
      {brand && (
        <BrandEditModal
          brand={brand}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveBrand}
        />
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">{t('brandAdmin.overview.quickActions')}</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('brandAdminSwitchTab', {
                  detail: { tab: 'workers', openInvite: true },
                }),
              )
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('brandAdmin.overview.inviteWorker')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.overview.inviteWorkerDesc')}
            </div>
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('brandAdminSwitchTab', { detail: { tab: 'cafes' } }),
              )
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('brandAdmin.overview.manageCafes')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.overview.manageCafesDesc')}
            </div>
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('brandAdminSwitchTab', { detail: { tab: 'activity-logs' } }),
              )
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('brandAdmin.overview.viewActivityLogs')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.overview.viewActivityLogsDesc')}
            </div>
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('brandAdminSwitchTab', { detail: { tab: 'workers' } }),
              )
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">{t('brandAdmin.overview.manageWorkers')}</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.overview.manageWorkersDesc')}
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}

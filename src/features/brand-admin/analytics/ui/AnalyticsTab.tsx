'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';
import {
  getBrandStats,
  getBrandOrdersAnalytics,
  getBrandPopularItemsAnalytics,
  BrandStats,
  BrandOrdersAnalytics,
  BrandPopularItems,
} from '../api/analytics';
import { t } from '@/i18n';

export function AnalyticsTab() {
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [ordersAnalytics, setOrdersAnalytics] = useState<BrandOrdersAnalytics | null>(null);
  const [popularItems, setPopularItems] = useState<BrandPopularItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, ordersData, popularItemsData] = await Promise.all([
        getBrandStats(),
        getBrandOrdersAnalytics(),
        getBrandPopularItemsAnalytics(),
      ]);

      setStats(statsData);
      setOrdersAnalytics(ordersData);
      setPopularItems(popularItemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknown'));
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t('brandAdmin.analytics.title')}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.analytics.subtitle')}
          </p>
        </div>
        <Card className="p-6">
          <p className="text-center text-[rgb(var(--tc-muted))]">{t('common.loading')}</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t('brandAdmin.analytics.title')}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.analytics.subtitle')}
          </p>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600">
              {t('common.error')}: {error}
            </p>
            <Button onClick={fetchData} className="mt-4">
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t('brandAdmin.analytics.title')}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.analytics.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">{t('brandAdmin.analytics.exportPdf')}</Button>
          <Button variant="secondary">{t('brandAdmin.analytics.exportExcel')}</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">{stats?.totalOrders || 0}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.analytics.totalOrders')}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">
            <MoneyAmount value={stats?.totalRevenue ?? 0} iconClassName="h-[1.1em] w-[0.9em]" />
          </h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.analytics.totalRevenue')}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">{stats?.activeCafes || 0}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.analytics.activeCafes')}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">{stats?.totalReviews || 0}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.analytics.totalReviews')}
          </p>
        </Card>
      </div>

      {/* Orders Analytics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('brandAdmin.analytics.ordersAndRevenue')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.analytics.periodOrders')}
            </p>
            <p className="text-xl font-semibold">{ordersAnalytics?.periodOrders || 0}</p>
          </div>
          <div>
            <p className="text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.analytics.periodRevenue')}
            </p>
            <p className="text-xl font-semibold">
              <MoneyAmount
                value={ordersAnalytics?.periodRevenue ?? 0}
                iconClassName="h-[1em] w-[0.85em]"
              />
            </p>
          </div>
        </div>
      </Card>

      {/* Popular Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('brandAdmin.analytics.popularItems')}</h3>
        {popularItems?.popularItems.slice(0, 5).map((item, index) => (
          <div
            key={index}
            className="flex justify-between py-2 border-b border-[rgb(var(--tc-border))] last:border-0"
          >
            <span>{item.name}</span>
            <span className="font-medium">
              {item.count} {t('brandAdmin.analytics.ordersCountShort')} ({item.percentage}%)
            </span>
          </div>
        )) || <p className="text-[rgb(var(--tc-muted))]">{t('brandAdmin.analytics.noData')}</p>}
      </Card>

      {/* Cafe Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('brandAdmin.analytics.cafePerformance')}</h3>
        {popularItems?.cafePerformance.map((cafe, index) => (
          <div
            key={index}
            className="flex justify-between py-2 border-b border-[rgb(var(--tc-border))] last:border-0"
          >
            <span>{cafe.cafeName}</span>
            <span className="font-medium">
              {cafe.totalOrders} {t('brandAdmin.analytics.ordersCountShort')}
            </span>
          </div>
        )) || <p className="text-[rgb(var(--tc-muted))]">{t('brandAdmin.analytics.noData')}</p>}
      </Card>
    </div>
  );
}

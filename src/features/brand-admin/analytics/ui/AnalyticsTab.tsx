'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import {
  getBrandStats,
  getBrandOrdersAnalytics,
  getBrandPopularItemsAnalytics,
  BrandStats,
  BrandOrdersAnalytics,
  BrandPopularItems,
} from '../api/analytics';

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
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            View brand statistics, reports, and insights.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-center text-[rgb(var(--tc-muted))]">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            View brand statistics, reports, and insights.
          </p>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchData} className="mt-4">
              Retry
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
          <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            View brand statistics, reports, and insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export to PDF</Button>
          <Button variant="secondary">Export to Excel</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">{stats?.totalOrders || 0}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Total Orders</p>
        </Card>
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Total Revenue</p>
        </Card>
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">{stats?.activeCafes || 0}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Active Cafes</p>
        </Card>
        <Card className="p-4 text-center">
          <h3 className="text-2xl font-bold">{stats?.totalReviews || 0}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Total Reviews</p>
        </Card>
      </div>

      {/* Orders Analytics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Orders & Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[rgb(var(--tc-muted))]">Period Orders</p>
            <p className="text-xl font-semibold">{ordersAnalytics?.periodOrders || 0}</p>
          </div>
          <div>
            <p className="text-sm text-[rgb(var(--tc-muted))]">Period Revenue</p>
            <p className="text-xl font-semibold">
              ${ordersAnalytics?.periodRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </Card>

      {/* Popular Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Items</h3>
        {popularItems?.popularItems.slice(0, 5).map((item, index) => (
          <div
            key={index}
            className="flex justify-between py-2 border-b border-[rgb(var(--tc-border))] last:border-0"
          >
            <span>{item.name}</span>
            <span className="font-medium">
              {item.count} orders ({item.percentage}%)
            </span>
          </div>
        )) || <p className="text-[rgb(var(--tc-muted))]">No popular items data available</p>}
      </Card>

      {/* Cafe Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cafe Performance</h3>
        {popularItems?.cafePerformance.map((cafe, index) => (
          <div
            key={index}
            className="flex justify-between py-2 border-b border-[rgb(var(--tc-border))] last:border-0"
          >
            <span>{cafe.cafeName}</span>
            <span className="font-medium">{cafe.totalOrders} orders</span>
          </div>
        )) || <p className="text-[rgb(var(--tc-muted))]">No cafe performance data available</p>}
      </Card>
    </div>
  );
}

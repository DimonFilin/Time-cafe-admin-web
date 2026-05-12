'use client';

import { useEffect, useState } from 'react';

import type { HealthCheck, SystemMetrics } from '@/entities/system/types/system';
import { getHealthCheck, getMetrics } from '../api/monitoring';
import { Card } from '@/shared/ui/card/Card';
import { t } from '@/i18n';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}д ${hours}ч ${minutes}м`;
  }
  if (hours > 0) {
    return `${hours}ч ${minutes}м ${secs}с`;
  }
  if (minutes > 0) {
    return `${minutes}м ${secs}с`;
  }
  return `${secs}с`;
}

function HealthStatusBadge({ status }: { status: 'healthy' | 'unhealthy' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        status === 'healthy'
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}
    >
      {status === 'healthy'
        ? `✓ ${t('systemAdmin.monitoring.healthy')}`
        : `✗ ${t('systemAdmin.monitoring.unhealthy')}`}
    </span>
  );
}

function CheckStatusBadge({ status }: { status: 'ok' | 'error' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        status === 'ok'
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}
    >
      {status === 'ok' ? 'OK' : 'ERROR'}
    </span>
  );
}

export function MonitoringDashboard() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refresh = async () => {
    setError(null);
    try {
      const [healthData, metricsData] = await Promise.all([getHealthCheck(), getMetrics()]);
      setHealth(healthData);
      setMetrics(metricsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !health && !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[rgb(var(--tc-muted))]">
          {t('systemAdmin.monitoring.loadingMetrics')}
        </div>
      </div>
    );
  }

  const memoryUsagePercent =
    metrics && metrics.memory.heapTotal > 0
      ? Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)
      : 0;

  const successRate =
    metrics && metrics.requests.total > 0
      ? Math.round((metrics.requests.successful / metrics.requests.total) * 100)
      : 100;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--tc-fg))]">
            {t('systemAdmin.monitoring.title')}
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.monitoring.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.monitoring.autoRefresh')}
            </span>
          </label>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg bg-[rgb(var(--tc-accent))] px-4 py-2 text-sm font-medium text-[rgb(var(--tc-accent-contrast))] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t('systemAdmin.monitoring.refreshing') : t('systemAdmin.monitoring.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Health Check */}
      {health && (
        <Card className="bg-[rgb(var(--tc-surface))]">
          <div className="border-b border-[rgb(var(--tc-border))] px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[rgb(var(--tc-fg))]">
                {t('systemAdmin.monitoring.healthCheck')}
              </h2>
              <HealthStatusBadge status={health.status} />
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(health.checks).map(([key, check]) => {
                if (!check) return null;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[rgb(var(--tc-fg))] capitalize">
                          {key === 'database'
                            ? t('systemAdmin.monitoring.database')
                            : key === 'storage'
                              ? t('systemAdmin.monitoring.storage')
                              : key}
                        </div>
                        {check.responseTime !== undefined && (
                          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
                            {t('systemAdmin.monitoring.responseTime')}: {check.responseTime}ms
                          </div>
                        )}
                        {check.message && (
                          <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {check.message}
                          </div>
                        )}
                      </div>
                      <CheckStatusBadge status={check.status} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.monitoring.lastUpdated')}:{' '}
              {new Date(health.timestamp).toLocaleString('ru-RU')}
            </div>
          </div>
        </Card>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Memory */}
          <Card className="bg-[rgb(var(--tc-surface))]">
            <div className="border-b border-[rgb(var(--tc-border))] px-6 py-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--tc-fg))]">
                {t('systemAdmin.monitoring.memory')}
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[rgb(var(--tc-muted))]">
                      {t('systemAdmin.monitoring.used')}
                    </span>
                    <span className="font-medium text-[rgb(var(--tc-fg))]">
                      {formatBytes(metrics.memory.heapUsed)} /{' '}
                      {formatBytes(metrics.memory.heapTotal)} ({memoryUsagePercent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--tc-surface-2))]">
                    <div
                      className="h-full bg-[rgb(var(--tc-accent))] transition-all"
                      style={{ width: `${memoryUsagePercent}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[rgb(var(--tc-muted))]">RSS</div>
                    <div className="font-medium text-[rgb(var(--tc-fg))]">
                      {formatBytes(metrics.memory.rss)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[rgb(var(--tc-muted))]">External</div>
                    <div className="font-medium text-[rgb(var(--tc-fg))]">
                      {formatBytes(metrics.memory.external)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Database */}
          <Card className="bg-[rgb(var(--tc-surface))]">
            <div className="border-b border-[rgb(var(--tc-border))] px-6 py-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--tc-fg))]">
                {t('systemAdmin.monitoring.database')}
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="text-3xl font-bold text-[rgb(var(--tc-fg))]">
                {metrics.database.activeConnections}
              </div>
              <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.monitoring.activeConnections')}
              </div>
            </div>
          </Card>

          {/* Requests */}
          <Card className="bg-[rgb(var(--tc-surface))] md:col-span-2">
            <div className="border-b border-[rgb(var(--tc-border))] px-6 py-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--tc-fg))]">
                {t('systemAdmin.monitoring.requests')}
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-[rgb(var(--tc-fg))]">
                    {metrics.requests.total.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.monitoring.totalRequests')}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {metrics.requests.successful.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.monitoring.successful')}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {metrics.requests.errors.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.monitoring.errors')}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[rgb(var(--tc-fg))]">
                    {metrics.requests.avgResponseTime.toFixed(1)}ms
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.monitoring.avgResponseTime')}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.monitoring.successRate')}
                  </span>
                  <span className="font-medium text-[rgb(var(--tc-fg))]">{successRate}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--tc-surface-2))]">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Uptime */}
          <Card className="bg-[rgb(var(--tc-surface))] md:col-span-2">
            <div className="border-b border-[rgb(var(--tc-border))] px-6 py-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--tc-fg))]">
                {t('systemAdmin.monitoring.uptime')}
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="text-3xl font-bold text-[rgb(var(--tc-fg))]">
                {formatUptime(metrics.uptime)}
              </div>
              <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.monitoring.lastUpdated')}:{' '}
                {new Date(metrics.timestamp).toLocaleString('ru-RU')}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import {
  getActivityLogsStatistics,
  type ActivityLogsStatistics,
  type ActivityLogsFilters,
} from '../api/activity-logs-api';

interface ActivityLogsStatsProps {
  filters: Pick<ActivityLogsFilters, 'startDate' | 'endDate'>;
}

export function ActivityLogsStats({ filters }: ActivityLogsStatsProps) {
  const [stats, setStats] = useState<ActivityLogsStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLogsStatistics({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch statistics');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 w-20 rounded bg-[rgb(var(--tc-surface-2))]" />
              <div className="mt-2 h-8 w-16 rounded bg-[rgb(var(--tc-surface-2))]" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <Card className="bg-red-50 p-4 text-sm text-red-700">{error}</Card>;
  }

  if (!stats) {
    return null;
  }

  // Calculate totals
  const totalLogs = stats.byAction.reduce((sum, item) => sum + item._count, 0);
  const loginCount = stats.byAction.find((item) => item.action === 'LOGIN')?._count || 0;
  const updateCount = stats.byAction
    .filter((item) => item.action === 'UPDATE' || item.action === 'BULK_UPDATE')
    .reduce((sum, item) => sum + item._count, 0);
  const criticalCount = stats.bySeverity.find((item) => item.severity === 'CRITICAL')?._count || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--tc-muted))]">Total Logs</p>
            <p className="mt-2 text-3xl font-semibold">{totalLogs.toLocaleString()}</p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Logins */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--tc-muted))]">Logins</p>
            <p className="mt-2 text-3xl font-semibold">{loginCount.toLocaleString()}</p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Updates */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--tc-muted))]">Updates</p>
            <p className="mt-2 text-3xl font-semibold">{updateCount.toLocaleString()}</p>
          </div>
          <div className="rounded-full bg-yellow-100 p-3">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Critical */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--tc-muted))]">Critical</p>
            <p className="mt-2 text-3xl font-semibold">{criticalCount.toLocaleString()}</p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
}

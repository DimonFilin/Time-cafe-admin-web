'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/shared/ui/card/Card';
import {
  getActivityLogs,
  type ActivityLog,
  type ActivityLogsFilters,
} from '../api/activity-logs-api';
import { ActivityLogsTable } from './ActivityLogsTable';
import { ActivityLogsFiltersComponent } from './ActivityLogsFilters';
import { ActivityLogDetailsModal } from './ActivityLogDetailsModal';
import { ActivityLogsStats } from './ActivityLogsStats';
import { exportLogsToCSV } from '../lib/export-csv';
import { t } from '@/i18n';
import {
  consumeActivityLogsWorker,
  type ActivityLogsPreselectedWorker,
} from '@/shared/lib/activity-logs-worker-bridge';

type Props = {
  preselectedWorker?: ActivityLogsPreselectedWorker | null;
  selectionKey?: number;
};

export function ActivityLogsTab({ preselectedWorker = null, selectionKey = 0 }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<ActivityLogsFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [initialWorker, setInitialWorker] = useState<ActivityLogsPreselectedWorker | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const { workerId, worker } = consumeActivityLogsWorker();
    if (!workerId) return;
    setFilters((prev) => ({ ...prev, workerId }));
    if (worker) setInitialWorker(worker);
  }, []);

  useEffect(() => {
    if (!preselectedWorker?.id) return;
    setFilters((prev) => ({ ...prev, workerId: preselectedWorker.id }));
    setInitialWorker(preselectedWorker);
    setPage(1);
  }, [preselectedWorker, selectionKey]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLogs({
        ...filters,
        page,
        limit: pageSize,
      });
      setLogs(data.logs);
      setTotal(data.pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cafeAdmin.activityLogs.fetchFailed'));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFiltersChange = (newFilters: ActivityLogsFilters) => {
    setFilters({
      ...newFilters,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
    if (!newFilters.workerId) setInitialWorker(null);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setInitialWorker(null);
    setPage(1);
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field as 'createdAt' | 'action' | 'category' | 'workerEmail',
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const data = await getActivityLogs({
        ...filters,
        limit: 10000,
      });

      if (data.logs.length === 0) {
        setError(t('cafeAdmin.activityLogs.noLogsToExport'));
        return;
      }

      exportLogsToCSV(data.logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cafeAdmin.activityLogs.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t('cafeAdmin.activityLogs.title')}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.subtitle')}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="rounded-md bg-[rgb(var(--tc-accent))] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting
            ? t('cafeAdmin.activityLogs.exporting')
            : t('cafeAdmin.activityLogs.exportCsv')}
        </button>
      </div>

      <ActivityLogsStats
        filters={{
          startDate: filters.startDate,
          endDate: filters.endDate,
        }}
      />

      <ActivityLogsFiltersComponent
        filters={filters}
        initialWorker={initialWorker}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {error && !loading && <Card className="bg-red-50 p-4 text-sm text-red-700">{error}</Card>}

      <ActivityLogsTable
        logs={logs}
        isLoading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onViewDetails={handleViewDetails}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
      />

      <ActivityLogDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}

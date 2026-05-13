'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WorkerResponse } from '../types/worker.types';
import { getWorkers, deleteWorker } from '../api/workers-api';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { InviteWorkerModal } from './InviteWorkerModal';
import { EditWorkerModal } from './EditWorkerModal';
import { t } from '@/i18n';

export function WorkersTab({
  initialOpenInvite = false,
  onInviteHandled,
}: {
  initialOpenInvite?: boolean;
  onInviteHandled?: () => void;
}) {
  const [workers, setWorkers] = useState<WorkerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editWorker, setEditWorker] = useState<WorkerResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'ON_SHIFT' | 'OFF_SHIFT'>('ALL');

  useEffect(() => {
    if (initialOpenInvite) {
      setInviteOpen(true);
      onInviteHandled?.();
    }
  }, [initialOpenInvite, onInviteHandled]);

  // Callback для переключения на таб Activity Logs
  const onViewLogs = (workerId: string) => {
    localStorage.setItem('activityLogs_selectedWorkerId', workerId);
    window.dispatchEvent(new CustomEvent('switchToActivityLogs', { detail: { workerId } }));
  };

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkers({
        page,
        limit,
        search: search || undefined,
        shiftStatus: shiftFilter !== 'ALL' ? shiftFilter : undefined,
      });
      setWorkers(data.workers || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch workers');
      setWorkers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, shiftFilter]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteWorker(deleteId);
      setDeleteOpen(false);
      await fetchWorkers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete worker');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: DataTableColumn<WorkerResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: (w) => (
        <div>
          <div className="font-medium">
            {w.firstName} {w.lastName}
          </div>
          <div className="text-xs text-[rgb(var(--tc-muted))]">{w.email}</div>
        </div>
      ),
    },
    {
      key: 'shiftStatus',
      header: t('common.status'),
      render: (w) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            w.shiftStatus === 'ON_SHIFT'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {w.shiftStatus === 'ON_SHIFT' ? t('workers.onShift') : t('workers.offShift')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('workers.created'),
      render: (w) => (
        <span className="text-sm text-[rgb(var(--tc-muted))]">
          {new Date(w.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (w) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onViewLogs(w.id)} className="text-xs">
            {t('dashboard.activityLogs')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setEditWorker(w);
              setEditOpen(true);
            }}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setDeleteId(w.id);
              setDeleteOpen(true);
            }}
          >
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('workers.title')}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">{t('workers.subtitle')}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>+ {t('workers.invite')}</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder={t('workers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-4 py-2 text-sm"
        />
        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value as 'ALL' | 'ON_SHIFT' | 'OFF_SHIFT')}
          className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-4 py-2 text-sm"
        >
          <option value="ALL">{t('workers.allWorkers')}</option>
          <option value="ON_SHIFT">{t('workers.onShift')}</option>
          <option value="OFF_SHIFT">{t('workers.offShift')}</option>
        </select>
      </div>

      {error && <Card className="p-3 text-sm text-red-700">{error}</Card>}

      <DataTable<WorkerResponse>
        rows={workers}
        columns={columns}
        getRowId={(w) => w.id}
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
        isLoading={loading}
        error={error}
      />

      <InviteWorkerModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={fetchWorkers}
      />

      <EditWorkerModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        worker={editWorker}
        onSuccess={fetchWorkers}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title={t('workers.delete')}
        message={t('workers.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={deleteLoading}
      />
    </div>
  );
}

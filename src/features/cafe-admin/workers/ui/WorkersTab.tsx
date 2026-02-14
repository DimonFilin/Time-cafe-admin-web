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

export function WorkersTab() {
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
      header: 'Name',
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
      header: 'Status',
      render: (w) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            w.shiftStatus === 'ON_SHIFT'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {w.shiftStatus === 'ON_SHIFT' ? 'On Shift' : 'Off Shift'}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (w) => <span className="text-sm font-medium">${w.balance}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (w) => (
        <span className="text-sm text-[rgb(var(--tc-muted))]">
          {new Date(w.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (w) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onViewLogs(w.id)} className="text-xs">
            View Logs
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setEditWorker(w);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setDeleteId(w.id);
              setDeleteOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Workers</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Manage workers in your cafe</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>+ Invite Worker</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-4 py-2 text-sm"
        />
        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value as 'ALL' | 'ON_SHIFT' | 'OFF_SHIFT')}
          className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-4 py-2 text-sm"
        >
          <option value="ALL">All Workers</option>
          <option value="ON_SHIFT">On Shift</option>
          <option value="OFF_SHIFT">Off Shift</option>
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
        title="Delete Worker"
        message="Are you sure you want to delete this worker? This action cannot be undone."
        confirmText="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}

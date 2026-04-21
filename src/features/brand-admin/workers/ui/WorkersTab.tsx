'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WorkerProfile } from '../api/workers';
import { listWorkers, inviteWorker, updateWorker, deleteWorker } from '../api/workers';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { InviteWorkerModal, type InviteFormData } from './InviteWorkerModal';
import { EditWorkerModal, type EditFormData } from './EditWorkerModal';
import { getCafes, type CafeListItem } from '../../cafes/api/cafes';

export function WorkersTab({
  initialOpenInvite = false,
  onInviteHandled,
}: {
  initialOpenInvite?: boolean;
  onInviteHandled?: () => void;
}) {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [cafes, setCafes] = useState<CafeListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [editWorker, setEditWorker] = useState<WorkerProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (initialOpenInvite) {
      setInviteOpen(true);
      onInviteHandled?.();
    }
  }, [initialOpenInvite, onInviteHandled]);

  // Callback для переключения на таб Activity Logs
  const onViewLogs = (workerId: string) => {
    // Сохраняем workerId в localStorage для передачи в Activity Logs
    localStorage.setItem('activityLogs_selectedWorkerId', workerId);
    // Триггерим событие для переключения таба
    window.dispatchEvent(new CustomEvent('switchToActivityLogs', { detail: { workerId } }));
  };

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWorkers({ page, limit });
      setWorkers(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch workers');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const fetchCafes = useCallback(async () => {
    try {
      const data = await getCafes({ page: 1, limit: 100 });
      setCafes(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      console.error('Failed to fetch cafes:', e);
    }
  }, []);

  useEffect(() => {
    // Fetch current user info
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (e) {
        console.error('Failed to fetch current user:', e);
      }
    };

    fetchCurrentUser();
    fetchWorkers();
    fetchCafes();
  }, [fetchWorkers, fetchCafes]);

  const onInviteWorker = async (data: InviteFormData) => {
    setInviteLoading(true);
    setInviteError(null);
    try {
      await inviteWorker(data);
      setInviteOpen(false);
      await fetchWorkers();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Failed to invite worker');
    } finally {
      setInviteLoading(false);
    }
  };

  const onEditWorker = async (id: string, data: EditFormData) => {
    setEditLoading(true);
    setEditError(null);
    try {
      await updateWorker(id, data);
      setEditOpen(false);
      await fetchWorkers();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update worker');
    } finally {
      setEditLoading(false);
    }
  };

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

  const columns: DataTableColumn<WorkerProfile>[] = [
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
      key: 'role',
      header: 'Role',
      render: (w) => <span className="text-sm">{w.role}</span>,
    },
    {
      key: 'cafeId',
      header: 'Cafe',
      render: (w) => {
        if (!w.cafeId) return <span className="text-[rgb(var(--tc-muted))]">—</span>;
        const cafe = cafes.find((c) => c.id === w.cafeId);
        return <span className="text-sm">{cafe?.name || w.cafeId}</span>;
      },
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
              setEditError(null);
            }}
          >
            Edit
          </Button>
          {currentUser?.id !== w.id && (
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteId(w.id);
                setDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Workers</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Invite and manage team members for your brand.
          </p>
        </div>
        <Button
          onClick={() => {
            setInviteOpen(true);
            setInviteError(null);
          }}
        >
          + Invite Worker
        </Button>
      </div>

      {error && <Card className="p-3 text-sm text-red-700">{error}</Card>}

      <DataTable<WorkerProfile>
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
        onClose={() => {
          setInviteOpen(false);
          setInviteError(null);
        }}
        onSubmit={onInviteWorker}
        loading={inviteLoading}
        error={inviteError}
        cafes={cafes.map((c) => ({ id: c.id, name: c.name }))}
      />

      <EditWorkerModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditError(null);
        }}
        onSubmit={onEditWorker}
        worker={editWorker}
        loading={editLoading}
        error={editError}
        cafes={cafes.map((c) => ({ id: c.id, name: c.name }))}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Worker"
        message="Are you sure you want to delete this worker?"
        confirmText="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  WorkerRow,
  ListWorkersParams,
  WorkerListResponse,
} from '@/features/system-admin/workers/api/workers';
import {
  listWorkers,
  registerWorker,
  updateWorker,
  deleteWorker,
  type WorkerRole,
} from '@/features/system-admin/workers/api/workers';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';

type WorkerFormState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: WorkerRole;
  brandId: string;
  cafeId: string;
};

function toWorkerForm(): WorkerFormState {
  return {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'WORKER',
    brandId: '',
    cafeId: '',
  };
}

export function WorkerAccountsAdmin() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    email: '',
    role: '',
    includeDeleted: false,
  });

  // Create worker modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<WorkerFormState>(() => toWorkerForm());
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingWorker, setDeletingWorker] = useState<WorkerRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListWorkersParams = {
        page,
        limit: 20,
        role: (filters.role.trim() || undefined) as WorkerRole | undefined,
        includeDeleted: filters.includeDeleted || undefined,
      };
      const data: WorkerListResponse = await listWorkers(params);
      setWorkers(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = useCallback(async () => {
    const { email, password, firstName, lastName, role, brandId, cafeId } = createForm;

    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
      setCreateError('Email, password, first name, and last name are required');
      return;
    }

    if (role !== 'SYSTEM_ADMIN' && !brandId.trim()) {
      setCreateError('Brand is required for this role');
      return;
    }

    if (role === 'CAFE_ADMIN' && !cafeId.trim()) {
      setCreateError('Cafe is required for CAFE_ADMIN role');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    try {
      await registerWorker({
        email: email.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        brandId: brandId.trim() || undefined,
        cafeId: cafeId.trim() || undefined,
      });
      setCreateOpen(false);
      setCreateForm(toWorkerForm());
      setPage(1);
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create worker');
    } finally {
      setCreateLoading(false);
    }
  }, [createForm, refresh]);

  const handleDelete = useCallback(async () => {
    if (!deletingWorker) return;

    setDeleteLoading(true);
    try {
      await deleteWorker(deletingWorker.id);
      setDeleteOpen(false);
      setDeletingWorker(null);
      await refresh();
    } catch {
      // Error will be shown in modal
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingWorker, refresh]);

  const columns = useMemo<DataTableColumn<WorkerRow>[]>(
    () => [
      {
        key: 'id',
        header: 'ID',
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{w.id.slice(0, 8)}</span>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        render: (w) => <span className="font-medium">{w.email}</span>,
      },
      {
        key: 'name',
        header: 'Name',
        render: (w) => (
          <span>
            {w.firstName} {w.lastName}
          </span>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (w) => (
          <span className="inline-flex items-center rounded-full bg-[rgb(var(--tc-accent))]/10 px-3 py-1 text-xs font-medium text-[rgb(var(--tc-accent))]">
            {w.role}
          </span>
        ),
      },
      {
        key: 'brand',
        header: 'Brand ID',
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">
            {w.brandId ? w.brandId.slice(0, 8) : '—'}
          </span>
        ),
      },
      {
        key: 'cafe',
        header: 'Cafe ID',
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">
            {w.cafeId ? w.cafeId.slice(0, 8) : '—'}
          </span>
        ),
      },
      {
        key: 'deleted',
        header: 'Deleted',
        render: (w) => (
          <input
            type="checkbox"
            checked={!!w.deletedAt}
            readOnly
            className="h-4 w-4 accent-[rgb(var(--tc-accent))]"
          />
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (w) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(w.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (w) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingWorker(w);
                setDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            Worker Accounts (SYSTEM_ADMIN)
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Create, view, and manage worker accounts (BRAND_ADMIN, CAFE_ADMIN, WORKER,
            SYSTEM_ADMIN).
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            + Create Worker Account
          </Button>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Email</div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.email}
              onChange={(e) => setFilters((s) => ({ ...s, email: e.target.value }))}
              placeholder="Filter by email"
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Role</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.role}
              onChange={(e) => setFilters((s) => ({ ...s, role: e.target.value }))}
            >
              <option value="">All roles</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
              <option value="BRAND_ADMIN">Brand Admin</option>
              <option value="CAFE_ADMIN">Cafe Admin</option>
              <option value="WORKER">Worker</option>
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Include Deleted</div>
            <input
              type="checkbox"
              checked={filters.includeDeleted}
              onChange={(e) => setFilters((s) => ({ ...s, includeDeleted: e.target.checked }))}
              className="h-4 w-4 accent-[rgb(var(--tc-accent))]"
            />
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 text-sm text-[rgb(var(--tc-danger))] bg-[rgb(var(--tc-danger))]/10">
          {error}
        </Card>
      )}

      <DataTable
        rows={workers}
        columns={columns}
        getRowId={(w) => w.id}
        isLoading={loading}
        error={null}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={() => {}}
      />

      {/* Create Worker Modal */}
      <Modal
        open={createOpen}
        title="Create Worker Account"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {createError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{createError}</Card>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="worker@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="Secure password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              value={createForm.firstName}
              onChange={(e) => setCreateForm((s) => ({ ...s, firstName: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input
              type="text"
              value={createForm.lastName}
              onChange={(e) => setCreateForm((s) => ({ ...s, lastName: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="Last name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((s) => ({ ...s, role: e.target.value as WorkerRole }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
            >
              <option value="SYSTEM_ADMIN">System Admin</option>
              <option value="BRAND_ADMIN">Brand Admin</option>
              <option value="CAFE_ADMIN">Cafe Admin</option>
              <option value="WORKER">Worker</option>
            </select>
          </div>

          {createForm.role !== 'SYSTEM_ADMIN' && (
            <div>
              <label className="block text-sm font-medium mb-1">Brand ID *</label>
              <input
                type="text"
                value={createForm.brandId}
                onChange={(e) => setCreateForm((s) => ({ ...s, brandId: e.target.value }))}
                className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
                placeholder="UUID of the brand"
              />
            </div>
          )}

          {createForm.role === 'CAFE_ADMIN' && (
            <div>
              <label className="block text-sm font-medium mb-1">Cafe ID *</label>
              <input
                type="text"
                value={createForm.cafeId}
                onChange={(e) => setCreateForm((s) => ({ ...s, cafeId: e.target.value }))}
                className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
                placeholder="UUID of the cafe"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={deleteOpen}
        title="Delete Worker Account"
        message={`Are you sure you want to delete "${deletingWorker?.email}"? This is a soft delete.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}

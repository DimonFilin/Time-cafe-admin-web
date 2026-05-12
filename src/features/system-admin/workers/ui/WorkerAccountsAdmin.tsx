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
  deleteWorker,
  type WorkerRole,
} from '@/features/system-admin/workers/api/workers';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';
import { t } from '@/i18n';

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
      setCreateError(t('systemAdmin.workerAccounts.requiredFields'));
      return;
    }

    if (role !== 'SYSTEM_ADMIN' && !brandId.trim()) {
      setCreateError(t('systemAdmin.workerAccounts.brandRequired'));
      return;
    }

    if (role === 'CAFE_ADMIN' && !cafeId.trim()) {
      setCreateError(t('systemAdmin.workerAccounts.cafeRequired'));
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
        header: t('common.name'),
        render: (w) => (
          <span>
            {w.firstName} {w.lastName}
          </span>
        ),
      },
      {
        key: 'role',
        header: t('workers.role'),
        render: (w) => (
          <span className="inline-flex items-center rounded-full bg-[rgb(var(--tc-accent))]/10 px-3 py-1 text-xs font-medium text-[rgb(var(--tc-accent))]">
            {w.role}
          </span>
        ),
      },
      {
        key: 'brand',
        header: t('systemAdmin.workerAccounts.brandId'),
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">
            {w.brandId ? w.brandId.slice(0, 8) : '—'}
          </span>
        ),
      },
      {
        key: 'cafe',
        header: t('systemAdmin.workerAccounts.cafeId'),
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">
            {w.cafeId ? w.cafeId.slice(0, 8) : '—'}
          </span>
        ),
      },
      {
        key: 'deleted',
        header: t('systemAdmin.users.deleted'),
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
        header: t('workers.created'),
        render: (w) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(w.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (w) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingWorker(w);
                setDeleteOpen(true);
              }}
            >
              {t('common.delete')}
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
            {t('systemAdmin.workerAccounts.title')}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.workerAccounts.subtitle')}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            + {t('systemAdmin.workerAccounts.createAccount')}
          </Button>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('common.email')}</div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.email}
              onChange={(e) => setFilters((s) => ({ ...s, email: e.target.value }))}
              placeholder={t('systemAdmin.users.filterByEmail')}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('workers.role')}</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.role}
              onChange={(e) => setFilters((s) => ({ ...s, role: e.target.value }))}
            >
              <option value="">{t('systemAdmin.workerAccounts.allRoles')}</option>
              <option value="SYSTEM_ADMIN">{t('workers.roles.systemAdmin')}</option>
              <option value="BRAND_ADMIN">{t('workers.roles.brandAdmin')}</option>
              <option value="CAFE_ADMIN">{t('workers.roles.cafeAdmin')}</option>
              <option value="WORKER">{t('workers.roles.worker')}</option>
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.users.includeDeleted')}
            </div>
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
        title={t('systemAdmin.workerAccounts.createAccount')}
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? t('systemAdmin.workerAccounts.creating') : t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {createError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{createError}</Card>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.email')} *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="worker@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.login.password')} *</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder={t('systemAdmin.workerAccounts.securePassword')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('workers.firstName')} *</label>
            <input
              type="text"
              value={createForm.firstName}
              onChange={(e) => setCreateForm((s) => ({ ...s, firstName: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder={t('workers.firstName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('workers.lastName')} *</label>
            <input
              type="text"
              value={createForm.lastName}
              onChange={(e) => setCreateForm((s) => ({ ...s, lastName: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder={t('workers.lastName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('workers.role')} *</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((s) => ({ ...s, role: e.target.value as WorkerRole }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
            >
              <option value="SYSTEM_ADMIN">{t('workers.roles.systemAdmin')}</option>
              <option value="BRAND_ADMIN">{t('workers.roles.brandAdmin')}</option>
              <option value="CAFE_ADMIN">{t('workers.roles.cafeAdmin')}</option>
              <option value="WORKER">{t('workers.roles.worker')}</option>
            </select>
          </div>

          {createForm.role !== 'SYSTEM_ADMIN' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('systemAdmin.workerAccounts.brandId')} *
              </label>
              <input
                type="text"
                value={createForm.brandId}
                onChange={(e) => setCreateForm((s) => ({ ...s, brandId: e.target.value }))}
                className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
                placeholder={t('systemAdmin.workerAccounts.brandIdPlaceholder')}
              />
            </div>
          )}

          {createForm.role === 'CAFE_ADMIN' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('systemAdmin.workerAccounts.cafeId')} *
              </label>
              <input
                type="text"
                value={createForm.cafeId}
                onChange={(e) => setCreateForm((s) => ({ ...s, cafeId: e.target.value }))}
                className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
                placeholder={t('systemAdmin.workerAccounts.cafeIdPlaceholder')}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={deleteOpen}
        title={t('workers.delete')}
        message={t('systemAdmin.workerAccounts.deleteConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}

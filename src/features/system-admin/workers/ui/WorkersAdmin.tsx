'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Brand } from '@/entities/brand/types/brand';
import { listBrands } from '@/features/system-admin/brands/api/brands';
import type { MeResponse } from '@/shared/types/me';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';
import { t } from '@/i18n';
import {
  deleteWorker,
  listWorkers,
  registerWorker,
  type WorkerRole,
  type WorkerRow,
  updateWorker,
} from '../api/workers';

const roles: WorkerRole[] = ['SYSTEM_ADMIN', 'BRAND_ADMIN', 'CAFE_ADMIN', 'WORKER'];

function countsKey(role: WorkerRole) {
  return `role:${role}` as const;
}

export function WorkersAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    role: '' as '' | WorkerRole,
    brandId: '',
    cafeId: '',
    includeDeleted: false,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'WORKER' as WorkerRole,
    brandId: '',
    cafeId: '',
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refreshBrands = useCallback(async () => {
    setBrandsError(null);
    try {
      const b = await listBrands();
      setBrands(b);
    } catch (e) {
      setBrands([]);
      setBrandsError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listWorkers({
        page,
        limit,
        role: filters.role || undefined,
        brandId: filters.brandId.trim() || undefined,
        cafeId: filters.cafeId.trim() || undefined,
        includeDeleted: filters.includeDeleted || undefined,
      });
      setRows(data.items);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
    } catch (e) {
      setRows([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [filters, limit, page]);

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const base = {
        brandId: filters.brandId.trim() || undefined,
        cafeId: filters.cafeId.trim() || undefined,
        includeDeleted: filters.includeDeleted || undefined,
      };
      const results = await Promise.all(
        roles.map(async (r) => {
          const res = await listWorkers({ page: 1, limit: 1, role: r, ...base });
          return [countsKey(r), res.total] as const;
        }),
      );
      const next: Record<string, number> = {};
      for (const [k, v] of results) next[k] = v;
      setStats(next);
    } catch {
      setStats({});
    } finally {
      setStatsLoading(false);
    }
  }, [filters.brandId, filters.cafeId, filters.includeDeleted]);

  useEffect(() => {
    refreshBrands();
  }, [refreshBrands]);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return (await r.json()) as MeResponse;
      })
      .then((me) => setMeId(me.id))
      .catch(() => setMeId(null));
  }, []);

  useEffect(() => {
    refresh();
    refreshStats();
  }, [refresh, refreshStats]);

  const columns: DataTableColumn<WorkerRow>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'ID',
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{w.id}</span>
        ),
      },
      {
        key: 'name',
        header: t('workers.firstName'),
        render: (w) => (
          <div>
            <div className="font-medium">
              {w.firstName} {w.lastName}
            </div>
            <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">{w.email}</div>
            <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
              <span className="font-mono">{w.id}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: t('workers.role'),
        render: (w) => <span className="font-mono text-xs">{w.role}</span>,
      },
      {
        key: 'brand',
        header: t('systemAdmin.workerAccounts.brandId'),
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{w.brandId ?? '-'}</span>
        ),
      },
      {
        key: 'cafe',
        header: t('systemAdmin.workerAccounts.cafeId'),
        render: (w) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{w.cafeId ?? '-'}</span>
        ),
      },
      {
        key: 'deleted',
        header: t('systemAdmin.workersManagement.deleted'),
        render: (w) => (
          <input
            type="checkbox"
            checked={Boolean(w.deletedAt)}
            readOnly
            className="h-4 w-4 accent-[rgb(var(--tc-accent))]"
            title={w.deletedAt ? `deletedAt: ${w.deletedAt}` : 'active'}
          />
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[200px] text-right',
        render: (w) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="px-3 py-2"
              onClick={() => {
                setEditId(w.id);
                setEditEmail(w.email);
                setSaveError(null);
                setForm({
                  email: w.email,
                  password: '',
                  firstName: w.firstName,
                  lastName: w.lastName,
                  role: w.role,
                  brandId: w.brandId ?? '',
                  cafeId: w.cafeId ?? '',
                });
                setEditOpen(true);
              }}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2"
              disabled={w.role === 'SYSTEM_ADMIN' || (meId !== null && w.id === meId)}
              title={
                w.role === 'SYSTEM_ADMIN'
                  ? t('systemAdmin.workersManagement.cannotDeleteSystemAdmin')
                  : meId !== null && w.id === meId
                    ? t('systemAdmin.workersManagement.cannotDeleteSelf')
                    : undefined
              }
              onClick={() => {
                if (w.role === 'SYSTEM_ADMIN') return;
                if (meId !== null && w.id === meId) return;
                setDeleteId(w.id);
                setDeleteOpen(true);
              }}
            >
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [meId],
  );

  const openCreate = () => {
    setEditId(null);
    setEditEmail('');
    setSaveError(null);
    setForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'WORKER',
      brandId: filters.brandId || '',
      cafeId: filters.cafeId || '',
    });
    setEditOpen(true);
  };

  const validateRegister = () => {
    if (!form.email.trim()) return 'email обязателен';
    if (!form.password || form.password.length < 8) return 'password минимум 8 символов';
    if (!form.firstName.trim()) return 'firstName обязателен';
    if (!form.lastName.trim()) return 'lastName обязателен';
    if ((form.role === 'BRAND_ADMIN' || form.role === 'CAFE_ADMIN') && !form.brandId.trim())
      return 'brandId обязателен для BRAND_ADMIN/CAFE_ADMIN';
    if ((form.role === 'CAFE_ADMIN' || form.role === 'WORKER') && !form.cafeId.trim())
      return 'cafeId обязателен для CAFE_ADMIN/WORKER';
    return null;
  };

  const onSave = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      if (editId) {
        await updateWorker(editId, {
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          role: form.role,
          brandId: form.brandId.trim() || undefined,
          cafeId: form.cafeId.trim() || undefined,
        });
      } else {
        const v = validateRegister();
        if (v) throw new Error(v);
        await registerWorker({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: form.role,
          brandId: form.brandId.trim() || undefined,
          cafeId: form.cafeId.trim() || undefined,
        });
      }

      setEditOpen(false);
      await refresh();
      await refreshStats();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaveLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteWorker(deleteId);
      setDeleteOpen(false);
      await refresh();
      await refreshStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            {t('systemAdmin.workersManagement.title')}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.workersManagement.subtitle')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={refresh} disabled={isLoading}>
            {t('common.refresh')}
          </Button>
          <Button onClick={openCreate}>{t('systemAdmin.workersManagement.addWorker')}</Button>
        </div>
      </div>

      {brandsError && (
        <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{brandsError}</Card>
      )}
      {error && <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{error}</Card>}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('workers.role')}</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.role}
              onChange={(e) =>
                setFilters((s) => ({ ...s, role: e.target.value as '' | WorkerRole }))
              }
            >
              <option value="">{t('common.all')}</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('workers.brand')}</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.brandId}
              onChange={(e) => setFilters((s) => ({ ...s, brandId: e.target.value }))}
            >
              <option value="">{t('common.all')}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.workerAccounts.cafeId')}
            </div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.cafeId}
              onChange={(e) => setFilters((s) => ({ ...s, cafeId: e.target.value }))}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-[rgb(var(--tc-muted))]">
              <input
                type="checkbox"
                checked={filters.includeDeleted}
                onChange={(e) => setFilters((s) => ({ ...s, includeDeleted: e.target.checked }))}
              />
              {t('systemAdmin.workersManagement.showDeleted')}
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.workersManagement.total')}: <span className="font-mono">{total}</span>
            {statsLoading ? (
              <span className="ml-2">{t('systemAdmin.workersManagement.stats')}...</span>
            ) : (
              <span className="ml-2">
                {roles.map((r) => (
                  <span key={r} className="mr-3">
                    {r}: <span className="font-mono">{stats[countsKey(r)] ?? '-'}</span>
                  </span>
                ))}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPage(1);
                refresh();
                refreshStats();
              }}
            >
              {t('systemAdmin.cafes.apply')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({ role: '', brandId: '', cafeId: '', includeDeleted: false });
                setPage(1);
              }}
            >
              {t('systemAdmin.cafes.reset')}
            </Button>
          </div>
        </div>
      </Card>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(w) => w.id}
        isLoading={isLoading}
        error={null}
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={(s) => {
          setPage(1);
          setLimit(s);
        }}
      />

      <Modal
        open={editOpen}
        title={
          editId
            ? t('systemAdmin.workersManagement.editWorker')
            : t('systemAdmin.workersManagement.registerWorker')
        }
        onClose={() => setEditOpen(false)}
        size="2xl"
      >
        <div className="grid gap-3">
          {saveError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{saveError}</Card>
          )}

          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {editId ? t('systemAdmin.workersManagement.emailReadOnly') : `${t('common.email')} *`}
            </div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={editId ? editEmail : form.email}
              disabled={Boolean(editId)}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            />
          </div>

          {!editId && (
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.workersManagement.passwordRequired')}
              </div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.workersManagement.firstNameRequired')}
              </div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                value={form.firstName}
                onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.workersManagement.lastNameRequired')}
              </div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                value={form.lastName}
                onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.workersManagement.roleRequired')}
            </div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as WorkerRole }))}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.workerAccounts.brandId')}
              </div>
              <select
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                value={form.brandId}
                onChange={(e) => setForm((s) => ({ ...s, brandId: e.target.value }))}
              >
                <option value="">{t('systemAdmin.workersManagement.empty')}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.workerAccounts.cafeId')}
              </div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
                value={form.cafeId}
                onChange={(e) => setForm((s) => ({ ...s, cafeId: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={saveLoading}>
              {t('common.cancel')}
            </Button>
            <Button onClick={onSave} disabled={saveLoading}>
              {saveLoading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        title={t('systemAdmin.workersManagement.deleteWorker')}
        description={t('systemAdmin.workersManagement.deleteConfirm')}
        confirmText={t('common.delete')}
        isDanger
        isLoading={deleteLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

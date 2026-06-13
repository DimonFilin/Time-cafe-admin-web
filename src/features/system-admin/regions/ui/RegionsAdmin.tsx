'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Region, RegionListQuery } from '@/entities/region/types/region';
import { createRegion, deleteRegion, listRegions, updateRegion } from '../api/regions';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';
import { t } from '@/i18n';

type RegionFormState = {
  name: string;
  country: string;
};

function toForm(r?: Region | null): RegionFormState {
  return {
    name: r?.name ?? '',
    country: r?.country ?? '',
  };
}

export function RegionsAdmin() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RegionFormState>(() => toForm(null));
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editForm, setEditForm] = useState<RegionFormState>(() => toForm(null));
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRegion, setDeletingRegion] = useState<Region | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: RegionListQuery = { page, limit: 20 };
      const data = await listRegions(query);
      setRegions(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('systemAdmin.errors.loadRegions'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = useCallback(async () => {
    if (!createForm.name.trim() || !createForm.country.trim()) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      await createRegion({
        name: createForm.name.trim(),
        country: createForm.country.trim(),
      });
      setCreateOpen(false);
      setCreateForm(toForm(null));
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('systemAdmin.errors.createRegion'));
    } finally {
      setCreateLoading(false);
    }
  }, [createForm, refresh]);

  const handleEdit = useCallback(async () => {
    if (!editingRegion || !editForm.name.trim() || !editForm.country.trim()) return;

    setEditLoading(true);
    setEditError(null);
    try {
      await updateRegion(editingRegion.id, {
        name: editForm.name.trim(),
        country: editForm.country.trim(),
      });
      setEditOpen(false);
      setEditingRegion(null);
      setEditForm(toForm(null));
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : t('systemAdmin.errors.updateRegion'));
    } finally {
      setEditLoading(false);
    }
  }, [editingRegion, editForm, refresh]);

  const handleDelete = useCallback(async () => {
    if (!deletingRegion) return;

    setDeleteLoading(true);
    try {
      await deleteRegion(deletingRegion.id);
      setDeleteOpen(false);
      setDeletingRegion(null);
      await refresh();
    } catch {
      // Error will be shown in modal
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRegion, refresh]);

  const columns = useMemo<DataTableColumn<Region>[]>(
    () => [
      {
        key: 'id',
        header: t('common.id'),
        render: (r) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{r.id}</span>
        ),
      },
      {
        key: 'name',
        header: t('common.name'),
        render: (r) => <span className="font-medium">{r.name}</span>,
      },
      {
        key: 'country',
        header: t('systemAdmin.regions.country'),
        render: (r) => <span>{r.country}</span>,
      },
      {
        key: 'createdAt',
        header: t('workers.created'),
        render: (r) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (r) => (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingRegion(r);
                setEditForm(toForm(r));
                setEditError(null);
                setEditOpen(true);
              }}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingRegion(r);
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
            {t('systemAdmin.regions.title')}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.regions.subtitle')}
          </div>
        </div>
        <Button
          onClick={() => {
            setCreateForm(toForm(null));
            setCreateError(null);
            setCreateOpen(true);
          }}
        >
          {t('systemAdmin.regions.addRegion')}
        </Button>
      </div>

      {error && (
        <Card className="p-4 text-sm text-[rgb(var(--tc-danger))] bg-[rgb(var(--tc-danger))]/10">
          {error}
        </Card>
      )}

      <DataTable
        rows={regions}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={null}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={() => {}}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title={t('systemAdmin.regions.createRegion')}
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading || !createForm.name.trim() || !createForm.country.trim()}
            >
              {createLoading ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {createError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{createError}</Card>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder={t('systemAdmin.regions.regionName')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('systemAdmin.regions.country')}
            </label>
            <input
              type="text"
              value={createForm.country}
              onChange={(e) => setCreateForm((s) => ({ ...s, country: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder={t('systemAdmin.regions.countryPlaceholder')}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title={t('systemAdmin.regions.editRegion')}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editLoading || !editForm.name.trim() || !editForm.country.trim()}
            >
              {editLoading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{editError}</Card>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder={t('systemAdmin.regions.regionName')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('systemAdmin.regions.country')}
            </label>
            <input
              type="text"
              value={editForm.country}
              onChange={(e) => setEditForm((s) => ({ ...s, country: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder={t('systemAdmin.regions.countryPlaceholder')}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={deleteOpen}
        title={t('systemAdmin.regions.deleteRegion')}
        message={t('systemAdmin.regions.deleteConfirm').replace(
          '{name}',
          deletingRegion?.name ?? '',
        )}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}

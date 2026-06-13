'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Brand } from '@/entities/brand/types/brand';
import type { CafeListItem } from '@/entities/cafe/types/cafe';
import { deleteCafe, updateCafe } from '@/features/system-admin/brands/api/cafes';
import { listBrands } from '@/features/system-admin/brands/api/brands';
import { createCafe, geocode, listCafes, reverseGeocode } from '../api/cafes';
import { listRegions } from '@/features/system-admin/regions/api/regions';
import type { Region } from '@/entities/region/types/region';
import { SystemCafeFormModal } from './SystemCafeFormModal';
import type { CafeCardFormValues } from '@/features/cafe-card/types/cafe-card.types';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { t } from '@/i18n';

export function CafesAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);

  const [rows, setRows] = useState<CafeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    brandId: '',
    regionId: '',
    city: '',
    search: '',
    includeDeleted: false,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [geoLoading, setGeoLoading] = useState(false);

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
      const data = await listCafes({
        brandId: filters.brandId.trim() || undefined,
        regionId: filters.regionId.trim() || undefined,
        city: filters.city.trim() || undefined,
        search: filters.search.trim() || undefined,
        includeDeleted: filters.includeDeleted || undefined,
        page,
        limit,
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

  useEffect(() => {
    refreshBrands();
    listRegions({ page: 1, limit: 100 })
      .then((r) => setRegions(r.items))
      .catch(() => setRegions([]));
  }, [refreshBrands]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataTableColumn<CafeListItem>[] = useMemo(
    () => [
      {
        key: 'id',
        header: t('common.id'),
        render: (c) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{c.id}</span>
        ),
      },
      {
        key: 'name',
        header: t('common.name'),
        render: (c) => <div className="font-medium">{c.name}</div>,
      },
      {
        key: 'deleted',
        header: t('systemAdmin.workersManagement.deleted'),
        render: (c) => (
          <input
            type="checkbox"
            checked={Boolean(c.deletedAt)}
            readOnly
            className="h-4 w-4 accent-[rgb(var(--tc-accent))]"
            title={c.deletedAt ? `deletedAt: ${c.deletedAt}` : 'active'}
          />
        ),
      },
      {
        key: 'brand',
        header: t('systemAdmin.cafes.brand'),
        render: (c) => (
          <span className="text-[rgb(var(--tc-muted))]">{c.brandName ?? c.brandId}</span>
        ),
      },
      {
        key: 'city',
        header: t('systemAdmin.cafes.city'),
        render: (c) => <span className="text-[rgb(var(--tc-muted))]">{c.city}</span>,
      },
      {
        key: 'rating',
        header: t('systemAdmin.cafes.rating'),
        render: (c) => <span className="font-mono text-xs">{c.rating}</span>,
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[180px] text-right',
        render: (c) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="px-3 py-2"
              onClick={() => {
                setEditId(c.id);
                setEditOpen(true);
              }}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2"
              onClick={() => {
                setDeleteId(c.id);
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

  const openCreate = () => {
    setEditId(null);
    setEditOpen(true);
  };

  const handleSaveCafe = async (
    payload: ReturnType<typeof import('@/features/cafe-card/lib/map-to-api').cafeCardToApiPayload>,
    id: string | null,
  ) => {
    if (id) {
      await updateCafe(id, payload);
    } else {
      await createCafe({
        ...payload,
        brandId: payload.brandId ?? '',
        regionId: payload.regionId ?? '',
      });
    }
    await refresh();
  };

  const renderGeocodeSlot = (
    values: CafeCardFormValues,
    setValues: (v: CafeCardFormValues) => void,
  ) => (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="secondary"
        type="button"
        disabled={geoLoading}
        onClick={async () => {
          setGeoLoading(true);
          try {
            const inputAddress =
              values.address.trim() || `${values.city.trim()} ${values.street.trim()}`.trim();
            if (!inputAddress) throw new Error(t('apiErrors.geocodeAddressRequired'));
            const r = await geocode(inputAddress);
            setValues({
              ...values,
              latitude: String(r.latitude),
              longitude: String(r.longitude),
              address: r.formattedAddress || values.address,
              city: r.city ?? values.city,
            });
          } finally {
            setGeoLoading(false);
          }
        }}
      >
        {geoLoading ? '...' : t('systemAdmin.cafes.geocode')}
      </Button>
      <Button
        variant="secondary"
        type="button"
        disabled={geoLoading}
        onClick={async () => {
          setGeoLoading(true);
          try {
            const latitude = Number(values.latitude);
            const longitude = Number(values.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              throw new Error(t('apiErrors.geocodeCoordsInvalid'));
            }
            const r = await reverseGeocode(latitude, longitude);
            setValues({
              ...values,
              address: r.formattedAddress || values.address,
              city: r.city ?? values.city,
              street: r.street ?? values.street,
            });
          } finally {
            setGeoLoading(false);
          }
        }}
      >
        {geoLoading ? '...' : t('systemAdmin.cafes.reverseGeocode')}
      </Button>
    </div>
  );

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteCafe(deleteId);
      setDeleteOpen(false);
      await refresh();
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
            {t('systemAdmin.cafes.title')}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.cafes.subtitle')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={refresh} disabled={isLoading}>
            {t('common.refresh')}
          </Button>
          <Button onClick={openCreate}>{t('systemAdmin.cafes.createCafe')}</Button>
        </div>
      </div>

      {brandsError && (
        <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{brandsError}</Card>
      )}
      {error && <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{error}</Card>}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.cafes.brand')}
            </div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.brandId}
              onChange={(e) => setFilters((s) => ({ ...s, brandId: e.target.value }))}
            >
              <option value="">{t('systemAdmin.cafes.all')}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('systemAdmin.cafes.city')}</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.city}
              onChange={(e) => setFilters((s) => ({ ...s, city: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.cafes.regionId')}
            </div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.regionId}
              onChange={(e) => setFilters((s) => ({ ...s, regionId: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('common.search')}</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.search}
              onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-[rgb(var(--tc-muted))]">
            <input
              type="checkbox"
              checked={filters.includeDeleted}
              onChange={(e) => setFilters((s) => ({ ...s, includeDeleted: e.target.checked }))}
            />
            {t('systemAdmin.cafes.showDeleted')}
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPage(1);
                refresh();
              }}
            >
              {t('systemAdmin.cafes.apply')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({
                  brandId: '',
                  regionId: '',
                  city: '',
                  search: '',
                  includeDeleted: false,
                });
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
        getRowId={(c) => c.id}
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

      <SystemCafeFormModal
        open={editOpen}
        editId={editId}
        brands={brands}
        regions={regions}
        defaultBrandId={filters.brandId}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveCafe}
        geocodeSlot={renderGeocodeSlot}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Удалить cafe?"
        description="Точно хотите удалить кафе? Это soft delete."
        confirmText="Удалить"
        isDanger
        isLoading={deleteLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

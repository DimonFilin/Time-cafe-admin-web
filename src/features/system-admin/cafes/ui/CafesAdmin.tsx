'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Brand } from '@/entities/brand/types/brand';
import type { CafeListItem } from '@/entities/cafe/types/cafe';
import { deleteCafe, updateCafe } from '@/features/system-admin/brands/api/cafes';
import { listBrands } from '@/features/system-admin/brands/api/brands';
import { createCafe, geocode, listCafes, reverseGeocode } from '../api/cafes';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';

type CafeFormState = {
  name: string;
  description: string;
  address: string;
  city: string;
  street: string;
  latitude: string;
  longitude: string;
  brandId: string;
  regionId: string;
  cafeApiUrl: string;
  photosText: string;
};

function parseLines(text: string) {
  return text
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

export function CafesAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsError, setBrandsError] = useState<string | null>(null);

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
  const [form, setForm] = useState<CafeFormState>({
    name: '',
    description: '',
    address: '',
    city: '',
    street: '',
    latitude: '0',
    longitude: '0',
    brandId: '',
    regionId: '',
    cafeApiUrl: '',
    photosText: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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
  }, [refreshBrands]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataTableColumn<CafeListItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Название',
        render: (c) => <div className="font-medium">{c.name}</div>,
      },
      {
        key: 'deleted',
        header: 'Deleted',
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
        header: 'Бренд',
        render: (c) => (
          <span className="text-[rgb(var(--tc-muted))]">{c.brandName ?? c.brandId}</span>
        ),
      },
      {
        key: 'city',
        header: 'Город',
        render: (c) => <span className="text-[rgb(var(--tc-muted))]">{c.city}</span>,
      },
      {
        key: 'rating',
        header: 'Rating',
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
                setSaveError(null);
                setForm((s) => ({
                  ...s,
                  name: c.name,
                  address: c.address,
                  city: c.city,
                  latitude: String(c.latitude),
                  longitude: String(c.longitude),
                  photosText: (c.photos ?? []).join('\n'),
                  brandId: c.brandId,
                }));
                setEditOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2"
              onClick={() => {
                setDeleteId(c.id);
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

  const openCreate = () => {
    setEditId(null);
    setSaveError(null);
    setGeoError(null);
    setForm({
      name: '',
      description: '',
      address: '',
      city: '',
      street: '',
      latitude: '0',
      longitude: '0',
      brandId: filters.brandId || '',
      regionId: '',
      cafeApiUrl: '',
      photosText: '',
    });
    setEditOpen(true);
  };

  const onGeocode = async () => {
    setGeoLoading(true);
    setGeoError(null);
    try {
      const inputAddress =
        form.address.trim() || `${form.city.trim()} ${form.street.trim()}`.trim();
      if (!inputAddress) throw new Error('address обязателен для geocode');
      const r = await geocode(inputAddress);
      setForm((s) => ({
        ...s,
        latitude: String(r.latitude),
        longitude: String(r.longitude),
        address: r.formattedAddress || s.address,
        city: r.city ?? s.city,
      }));
    } catch (e) {
      setGeoError(e instanceof Error ? e.message : String(e));
    } finally {
      setGeoLoading(false);
    }
  };

  const onReverseGeocode = async () => {
    setGeoLoading(true);
    setGeoError(null);
    try {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('latitude/longitude должны быть числами для reverse-geocode');
      }
      const r = await reverseGeocode(latitude, longitude);
      setForm((s) => ({
        ...s,
        address: r.formattedAddress || s.address,
        city: r.city ?? s.city,
        street: r.street ?? s.street,
      }));
    } catch (e) {
      setGeoError(e instanceof Error ? e.message : String(e));
    } finally {
      setGeoLoading(false);
    }
  };

  const onSave = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      const photos = parseLines(form.photosText);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('latitude/longitude должны быть числами');
      }

      if (editId) {
        await updateCafe(editId, {
          name: form.name.trim() || undefined,
          description: form.description.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          street: form.street.trim() || undefined,
          latitude,
          longitude,
          brandId: form.brandId.trim() || undefined,
          regionId: form.regionId.trim() || undefined,
          cafeApiUrl: form.cafeApiUrl.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
        });
      } else {
        await createCafe({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          address: form.address.trim(),
          city: form.city.trim(),
          street: form.street.trim() || undefined,
          latitude,
          longitude,
          brandId: form.brandId.trim(),
          regionId: form.regionId.trim(),
          cafeApiUrl: form.cafeApiUrl.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
        });
      }

      setEditOpen(false);
      await refresh();
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
          <div className="text-2xl font-semibold tracking-tight">Cafes (SYSTEM_ADMIN)</div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Список берётся из `GET /cafes` (удалённые записи сейчас не показываются backend-ом).
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
          <Button onClick={openCreate}>Create cafe</Button>
        </div>
      </div>

      {brandsError && (
        <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{brandsError}</Card>
      )}
      {error && <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{error}</Card>}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Brand</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.brandId}
              onChange={(e) => setFilters((s) => ({ ...s, brandId: e.target.value }))}
            >
              <option value="">All</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">City</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.city}
              onChange={(e) => setFilters((s) => ({ ...s, city: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">RegionId</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.regionId}
              onChange={(e) => setFilters((s) => ({ ...s, regionId: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Search</div>
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
            Показывать удалённые
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPage(1);
                refresh();
              }}
            >
              Apply
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
              Reset
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

      <Modal
        open={editOpen}
        title={editId ? 'Edit cafe' : 'Create cafe'}
        onClose={() => setEditOpen(false)}
        size="2xl"
      >
        <div className="grid gap-3">
          {saveError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{saveError}</Card>
          )}
          {geoError && <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{geoError}</Card>}
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Brand *</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.brandId}
              onChange={(e) => setForm((s) => ({ ...s, brandId: e.target.value }))}
            >
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">RegionId *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={form.regionId}
              onChange={(e) => setForm((s) => ({ ...s, regionId: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">Name *</div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">City *</div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                value={form.city}
                onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Address *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span
              className="inline-flex items-center gap-2"
              title="Geocode — берёт address и автозаполняет latitude/longitude (+ может подправить address/city)"
            >
              <Button variant="secondary" onClick={onGeocode} disabled={geoLoading}>
                {geoLoading ? '...' : 'Geocode'}
              </Button>
              <span className="select-none text-sm text-[rgb(var(--tc-muted))]">?</span>
            </span>
            <span
              className="inline-flex items-center gap-2"
              title="Reverse geocode — берёт latitude/longitude и подставляет formattedAddress (+ city/street если пришли)"
            >
              <Button variant="secondary" onClick={onReverseGeocode} disabled={geoLoading}>
                {geoLoading ? '...' : 'Reverse geocode'}
              </Button>
              <span className="select-none text-sm text-[rgb(var(--tc-muted))]">?</span>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">Latitude *</div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
                value={form.latitude}
                onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">Longitude *</div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
                value={form.longitude}
                onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Cafe API URL</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.cafeApiUrl}
              onChange={(e) => setForm((s) => ({ ...s, cafeApiUrl: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Photos (one URL per line)</div>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.photosText}
              onChange={(e) => setForm((s) => ({ ...s, photosText: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Description</div>
            <textarea
              className="min-h-[90px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={saveLoading}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saveLoading}>
              {saveLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

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

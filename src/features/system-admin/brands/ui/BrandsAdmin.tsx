'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Brand } from '@/entities/brand/types/brand';
import type { BrandDocument } from '@/entities/brand/types/document';
import type { CafeListItem } from '@/entities/cafe/types/cafe';
import type { ApiKey, CreatedApiKey } from '@/entities/brand/types/api-key';
import type { WorkerProfile } from '@/entities/worker/types/worker';
import {
  createBrand,
  deleteBrand,
  listBrands,
  rejectBrand,
  suspendBrand,
  updateBrand,
  verifyBrand,
} from '../api/brands';
import {
  deleteBrandDocument,
  listBrandDocuments,
  uploadBrandDocument,
  verifyBrandDocument,
} from '../api/documents';
import { createCafe, deleteCafe, listBrandCafes, updateCafe } from '../api/cafes';
import { createApiKey, deleteApiKey, listApiKeys, updateApiKey } from '../api/api-keys';
import { listBrandWorkers } from '../api/workers';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';

type BrandFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  website: string;
};

function toForm(b?: Brand | null): BrandFormState {
  return {
    name: b?.name ?? '',
    email: b?.email ?? '',
    phone: b?.phone ?? '',
    address: b?.address ?? '',
    description: b?.description ?? '',
    website: b?.website ?? '',
  };
}

export function BrandsAdmin() {
  const [items, setItems] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandFormState>(() => toForm(null));
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<Brand['status'] | 'UNCHANGED'>('UNCHANGED');
  const [statusReason, setStatusReason] = useState('');

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsText, setSettingsText] = useState('{}');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [docsOpen, setDocsOpen] = useState(false);
  const [docsBrandId, setDocsBrandId] = useState<string | null>(null);
  const [docs, setDocs] = useState<BrandDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  const [docVerifyOpen, setDocVerifyOpen] = useState(false);
  const [docVerifyId, setDocVerifyId] = useState<string | null>(null);
  const [docVerifyNote, setDocVerifyNote] = useState('');
  const [docVerifyLoading, setDocVerifyLoading] = useState(false);
  const [docVerifyError, setDocVerifyError] = useState<string | null>(null);

  const [docDeleteOpen, setDocDeleteOpen] = useState(false);
  const [docDeleteId, setDocDeleteId] = useState<string | null>(null);
  const [docDeleteLoading, setDocDeleteLoading] = useState(false);

  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [docUploadType, setDocUploadType] = useState<BrandDocument['type']>('OTHER');
  const [docUploadName, setDocUploadName] = useState('');
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const [cafesOpen, setCafesOpen] = useState(false);
  const [cafesBrandId, setCafesBrandId] = useState<string | null>(null);
  const [cafes, setCafes] = useState<CafeListItem[]>([]);
  const [cafesLoading, setCafesLoading] = useState(false);
  const [cafesError, setCafesError] = useState<string | null>(null);
  const [cafesPage, setCafesPage] = useState(1);
  const [cafesLimit, setCafesLimit] = useState(20);
  const [cafesTotal, setCafesTotal] = useState(0);

  const [cafeEditOpen, setCafeEditOpen] = useState(false);
  const [cafeEditId, setCafeEditId] = useState<string | null>(null);
  const [cafeSaveLoading, setCafeSaveLoading] = useState(false);
  const [cafeSaveError, setCafeSaveError] = useState<string | null>(null);
  const [cafeForm, setCafeForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    street: '',
    latitude: '0',
    longitude: '0',
    regionId: '',
    cafeApiUrl: '',
    photosText: '',
  });

  const [cafeDeleteOpen, setCafeDeleteOpen] = useState(false);
  const [cafeDeleteId, setCafeDeleteId] = useState<string | null>(null);
  const [cafeDeleteLoading, setCafeDeleteLoading] = useState(false);

  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [apiKeysBrandId, setApiKeysBrandId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);

  const [apiKeyEditOpen, setApiKeyEditOpen] = useState(false);
  const [apiKeyEditId, setApiKeyEditId] = useState<string | null>(null);
  const [apiKeySaveLoading, setApiKeySaveLoading] = useState(false);
  const [apiKeySaveError, setApiKeySaveError] = useState<string | null>(null);
  const [apiKeyCreated, setApiKeyCreated] = useState<CreatedApiKey | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    permissionsText: '',
    expiresAt: '',
    isActive: true,
    clearExpires: false,
  });

  const [apiKeyDeleteOpen, setApiKeyDeleteOpen] = useState(false);
  const [apiKeyDeleteId, setApiKeyDeleteId] = useState<string | null>(null);
  const [apiKeyDeleteLoading, setApiKeyDeleteLoading] = useState(false);

  const [workersOpen, setWorkersOpen] = useState(false);
  const [workersBrandId, setWorkersBrandId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [workersPage, setWorkersPage] = useState(1);
  const [workersLimit, setWorkersLimit] = useState(20);
  const [workersTotal, setWorkersTotal] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const data = await listBrands();
      setItems(data);
    } catch (e) {
      setItems([]);
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const total = items.length;
  const rows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const openCreate = () => {
    setEditId(null);
    setEditing(null);
    setForm(toForm(null));
    setSaveError(null);
    setStatusTarget('UNCHANGED');
    setStatusReason('');
    setEditOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditId(b.id);
    setEditing(b);
    setForm(toForm(b));
    setSaveError(null);
    setStatusTarget('UNCHANGED');
    setStatusReason('');
    setEditOpen(true);
  };

  const openDelete = (b: Brand) => {
    setDeleteId(b.id);
    setDeleteOpen(true);
  };

  const openSettings = (b: Brand) => {
    setEditing(b);
    setSettingsError(null);
    setSettingsText(JSON.stringify(b.settings ?? {}, null, 2));
    setSettingsOpen(true);
  };

  const openDocuments = async (b: Brand) => {
    setDocsBrandId(b.id);
    setDocsOpen(true);
    setDocsError(null);
    setDocs([]);
    setDocsLoading(true);
    try {
      const data = await listBrandDocuments(b.id);
      setDocs(data);
    } catch (e) {
      setDocsError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocsLoading(false);
    }
  };

  const refreshDocuments = async () => {
    if (!docsBrandId) return;
    setDocsError(null);
    setDocsLoading(true);
    try {
      const data = await listBrandDocuments(docsBrandId);
      setDocs(data);
    } catch (e) {
      setDocsError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocsLoading(false);
    }
  };

  const refreshCafes = async (brandId: string, page: number, limit: number) => {
    setCafesError(null);
    setCafesLoading(true);
    try {
      const data = await listBrandCafes({ brandId, page, limit });
      setCafes(data.items);
      setCafesTotal(data.total);
      setCafesPage(data.page);
      setCafesLimit(data.limit);
    } catch (e) {
      setCafes([]);
      setCafesTotal(0);
      setCafesError(e instanceof Error ? e.message : String(e));
    } finally {
      setCafesLoading(false);
    }
  };

  const openCafes = async (b: Brand) => {
    setCafesBrandId(b.id);
    setCafesOpen(true);
    await refreshCafes(b.id, 1, cafesLimit);
  };

  const openCafeCreate = () => {
    if (!cafesBrandId) return;
    setCafeEditId(null);
    setCafeSaveError(null);
    setCafeForm({
      name: '',
      description: '',
      address: '',
      city: '',
      street: '',
      latitude: '0',
      longitude: '0',
      regionId: '',
      cafeApiUrl: '',
      photosText: '',
    });
    setCafeEditOpen(true);
  };

  const openCafeEdit = (c: CafeListItem) => {
    setCafeEditId(c.id);
    setCafeSaveError(null);
    setCafeForm((s) => ({
      ...s,
      name: c.name,
      address: c.address,
      city: c.city,
      latitude: String(c.latitude),
      longitude: String(c.longitude),
      photosText: (c.photos ?? []).join('\n'),
    }));
    setCafeEditOpen(true);
  };

  const openCafeDelete = (c: CafeListItem) => {
    setCafeDeleteId(c.id);
    setCafeDeleteOpen(true);
  };

  const parsePhotos = (text: string) =>
    text
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

  const onSaveCafe = async () => {
    if (!cafesBrandId) return;
    setCafeSaveLoading(true);
    setCafeSaveError(null);
    try {
      const latitude = Number(cafeForm.latitude);
      const longitude = Number(cafeForm.longitude);
      const photos = parsePhotos(cafeForm.photosText);

      if (cafeEditId) {
        await updateCafe(cafeEditId, {
          name: cafeForm.name.trim() || undefined,
          description: cafeForm.description.trim() || undefined,
          address: cafeForm.address.trim() || undefined,
          city: cafeForm.city.trim() || undefined,
          street: cafeForm.street.trim() || undefined,
          latitude: Number.isFinite(latitude) ? latitude : undefined,
          longitude: Number.isFinite(longitude) ? longitude : undefined,
          regionId: cafeForm.regionId.trim() || undefined,
          cafeApiUrl: cafeForm.cafeApiUrl.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
        });
      } else {
        await createCafe({
          brandId: cafesBrandId,
          name: cafeForm.name.trim(),
          description: cafeForm.description.trim() || undefined,
          address: cafeForm.address.trim(),
          city: cafeForm.city.trim(),
          street: cafeForm.street.trim() || undefined,
          latitude,
          longitude,
          regionId: cafeForm.regionId.trim(),
          cafeApiUrl: cafeForm.cafeApiUrl.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
        });
      }

      setCafeEditOpen(false);
      await refreshCafes(cafesBrandId, cafesPage, cafesLimit);
    } catch (e) {
      setCafeSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setCafeSaveLoading(false);
    }
  };

  const onConfirmDeleteCafe = async () => {
    if (!cafeDeleteId || !cafesBrandId) return;
    setCafeDeleteLoading(true);
    setCafesError(null);
    try {
      await deleteCafe(cafeDeleteId);
      setCafeDeleteOpen(false);
      await refreshCafes(cafesBrandId, cafesPage, cafesLimit);
    } catch (e) {
      setCafesError(e instanceof Error ? e.message : String(e));
    } finally {
      setCafeDeleteLoading(false);
    }
  };

  const refreshApiKeys = async (brandId: string) => {
    setApiKeysError(null);
    setApiKeysLoading(true);
    try {
      const data = await listApiKeys(brandId);
      setApiKeys(data);
    } catch (e) {
      setApiKeys([]);
      setApiKeysError(e instanceof Error ? e.message : String(e));
    } finally {
      setApiKeysLoading(false);
    }
  };

  const openApiKeys = async (b: Brand) => {
    setApiKeysBrandId(b.id);
    setApiKeyCreated(null);
    setApiKeysOpen(true);
    await refreshApiKeys(b.id);
  };

  const refreshWorkers = async (brandId: string, page: number, limit: number) => {
    setWorkersError(null);
    setWorkersLoading(true);
    try {
      const data = await listBrandWorkers({ brandId, page, limit });
      setWorkers(data.items);
      setWorkersTotal(data.total);
      setWorkersPage(data.page);
      setWorkersLimit(data.limit);
    } catch (e) {
      setWorkers([]);
      setWorkersTotal(0);
      setWorkersError(e instanceof Error ? e.message : String(e));
    } finally {
      setWorkersLoading(false);
    }
  };

  const openWorkers = async (b: Brand) => {
    setWorkersBrandId(b.id);
    setWorkersOpen(true);
    await refreshWorkers(b.id, 1, workersLimit);
  };

  const parsePermissions = (text: string) =>
    text
      .split(/[\n,]/g)
      .map((x) => x.trim())
      .filter(Boolean);

  const openApiKeyCreate = () => {
    if (!apiKeysBrandId) return;
    setApiKeyEditId(null);
    setApiKeyCreated(null);
    setApiKeySaveError(null);
    setApiKeyForm({
      name: '',
      permissionsText: '',
      expiresAt: '',
      isActive: true,
      clearExpires: false,
    });
    setApiKeyEditOpen(true);
  };

  const openApiKeyEdit = (k: ApiKey) => {
    if (!apiKeysBrandId) return;
    setApiKeyEditId(k.id);
    setApiKeyCreated(null);
    setApiKeySaveError(null);
    setApiKeyForm({
      name: k.name,
      permissionsText: (k.permissions ?? []).join('\n'),
      expiresAt: k.expiresAt ?? '',
      isActive: k.isActive,
      clearExpires: false,
    });
    setApiKeyEditOpen(true);
  };

  const openApiKeyDelete = (k: ApiKey) => {
    setApiKeyDeleteId(k.id);
    setApiKeyDeleteOpen(true);
  };

  const onSaveApiKey = async () => {
    if (!apiKeysBrandId) return;
    setApiKeySaveLoading(true);
    setApiKeySaveError(null);
    try {
      const permissions = parsePermissions(apiKeyForm.permissionsText);
      if (permissions.length === 0) throw new Error('permissions обязателен (минимум 1)');

      if (apiKeyEditId) {
        await updateApiKey({
          brandId: apiKeysBrandId,
          keyId: apiKeyEditId,
          name: apiKeyForm.name.trim() || undefined,
          permissions,
          isActive: apiKeyForm.isActive,
          expiresAt: apiKeyForm.clearExpires ? null : apiKeyForm.expiresAt.trim() || undefined,
        });
      } else {
        const created = await createApiKey({
          brandId: apiKeysBrandId,
          name: apiKeyForm.name.trim(),
          permissions,
          expiresAt: apiKeyForm.expiresAt.trim() || undefined,
        });
        setApiKeyCreated(created);
      }

      setApiKeyEditOpen(false);
      await refreshApiKeys(apiKeysBrandId);
    } catch (e) {
      setApiKeySaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setApiKeySaveLoading(false);
    }
  };

  const onConfirmDeleteApiKey = async () => {
    if (!apiKeysBrandId || !apiKeyDeleteId) return;
    setApiKeyDeleteLoading(true);
    setApiKeysError(null);
    try {
      await deleteApiKey({ brandId: apiKeysBrandId, keyId: apiKeyDeleteId });
      setApiKeyDeleteOpen(false);
      await refreshApiKeys(apiKeysBrandId);
    } catch (e) {
      setApiKeysError(e instanceof Error ? e.message : String(e));
    } finally {
      setApiKeyDeleteLoading(false);
    }
  };

  const openUploadDoc = () => {
    setDocUploadType('OTHER');
    setDocUploadName('');
    setDocUploadFile(null);
    setDocUploadError(null);
    setDocUploadOpen(true);
  };

  const onConfirmUploadDoc = async () => {
    if (!docsBrandId) return;
    if (!docUploadFile) {
      setDocUploadError('Файл обязателен');
      return;
    }
    if (!docUploadName.trim()) {
      setDocUploadError('Название документа обязательно');
      return;
    }

    setDocUploadLoading(true);
    setDocUploadError(null);
    try {
      await uploadBrandDocument({
        brandId: docsBrandId,
        type: docUploadType,
        name: docUploadName.trim(),
        file: docUploadFile,
      });
      setDocUploadOpen(false);
      await refreshDocuments();
    } catch (e) {
      setDocUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocUploadLoading(false);
    }
  };

  const columns: DataTableColumn<Brand>[] = [
    { key: 'name', header: 'Название', render: (b) => <div className="font-medium">{b.name}</div> },
    {
      key: 'status',
      header: 'Статус',
      render: (b) => <span className="font-mono text-xs">{b.status}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (b) => <span className="text-[rgb(var(--tc-muted))]">{b.email ?? '-'}</span>,
    },
    {
      key: 'phone',
      header: 'Телефон',
      render: (b) => <span className="text-[rgb(var(--tc-muted))]">{b.phone ?? '-'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[420px] text-right',
      render: (b) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" className="px-3 py-2" onClick={() => openCafes(b)}>
            Cafes
          </Button>
          <Button variant="secondary" className="px-3 py-2" onClick={() => openApiKeys(b)}>
            ApiKeys
          </Button>
          <Button variant="secondary" className="px-3 py-2" onClick={() => openWorkers(b)}>
            Workers
          </Button>
          <Button variant="secondary" className="px-3 py-2" onClick={() => openDocuments(b)}>
            Docs
          </Button>
          <Button variant="secondary" className="px-3 py-2" onClick={() => openSettings(b)}>
            Settings
          </Button>
          <Button variant="secondary" className="px-3 py-2" onClick={() => openEdit(b)}>
            Edit
          </Button>
          <Button variant="secondary" className="px-3 py-2" onClick={() => openDelete(b)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const onSave = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      if (editId) {
        await updateBrand(editId, {
          name: form.name || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          description: form.description || undefined,
          website: form.website || undefined,
        });

        if (editing && statusTarget !== 'UNCHANGED' && statusTarget !== editing.status) {
          if (statusTarget === 'ACTIVE') {
            await verifyBrand(editId);
          } else if (statusTarget === 'SUSPENDED') {
            await suspendBrand(editId, statusReason || undefined);
          } else if (statusTarget === 'REJECTED') {
            await rejectBrand(editId, statusReason || undefined);
          }
        }
      } else {
        await createBrand({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          description: form.description.trim() || undefined,
          website: form.website.trim() || undefined,
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
    setListError(null);
    try {
      await deleteBrand(deleteId);
      setDeleteOpen(false);
      await refresh();
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  const onSaveSettings = async () => {
    if (!editing) return;
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const parsed = JSON.parse(settingsText) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Settings должен быть JSON object (например: {"theme":{"mode":"light"}})');
      }
      await updateBrand(editing.id, { settings: parsed as Record<string, unknown> });
      setSettingsOpen(false);
      await refresh();
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : String(e));
    } finally {
      setSettingsLoading(false);
    }
  };

  const openVerifyDoc = (docId: string) => {
    setDocVerifyId(docId);
    setDocVerifyNote('');
    setDocVerifyError(null);
    setDocVerifyOpen(true);
  };

  const onConfirmVerifyDoc = async () => {
    if (!docsBrandId || !docVerifyId) return;
    setDocVerifyLoading(true);
    setDocVerifyError(null);
    try {
      await verifyBrandDocument(docsBrandId, docVerifyId, docVerifyNote || undefined);
      setDocVerifyOpen(false);
      await refreshDocuments();
    } catch (e) {
      setDocVerifyError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocVerifyLoading(false);
    }
  };

  const openDeleteDoc = (docId: string) => {
    setDocDeleteId(docId);
    setDocDeleteOpen(true);
  };

  const onConfirmDeleteDoc = async () => {
    if (!docsBrandId || !docDeleteId) return;
    setDocDeleteLoading(true);
    setDocsError(null);
    try {
      await deleteBrandDocument(docsBrandId, docDeleteId);
      setDocDeleteOpen(false);
      await refreshDocuments();
    } catch (e) {
      setDocsError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocDeleteLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Brands</div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            CRUD + пагинация (пока клиентская).
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
          <Button onClick={openCreate}>Add brand</Button>
        </div>
      </div>

      {listError && <Card className="p-4 text-sm text-[rgb(var(--tc-danger))]">{listError}</Card>}

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(b) => b.id}
        isLoading={isLoading}
        error={null}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={(s) => {
          setPage(1);
          setPageSize(s);
        }}
      />

      <Modal
        open={editOpen}
        title={editId ? 'Редактировать бренд' : 'Создать бренд'}
        onClose={() => setEditOpen(false)}
      >
        <div className="grid gap-3">
          {saveError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{saveError}</Card>
          )}
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Name *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Email *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Phone *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Address *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Website</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={form.website}
              onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
            />
          </div>

          {editId && editing && (
            <div className="mt-2 grid gap-2 rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-3">
              <div className="text-sm font-semibold">Статус / верификация</div>
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                Текущий статус: <span className="font-mono">{editing.status}</span>, isVerified:{' '}
                <span className="font-mono">{String(editing.isVerified)}</span>
              </div>
              <div className="grid gap-1">
                <div className="text-xs text-[rgb(var(--tc-muted))]">Изменить статус</div>
                <select
                  className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                  value={statusTarget}
                  onChange={(e) => setStatusTarget(e.target.value as Brand['status'] | 'UNCHANGED')}
                >
                  <option value="UNCHANGED">Без изменений</option>
                  <option value="ACTIVE" disabled={editing.status === 'ACTIVE'}>
                    ACTIVE (verify)
                  </option>
                  <option value="SUSPENDED" disabled={editing.status === 'SUSPENDED'}>
                    SUSPENDED
                  </option>
                  <option value="REJECTED" disabled={editing.status === 'REJECTED'}>
                    REJECTED
                  </option>
                </select>
              </div>
              {(statusTarget === 'SUSPENDED' || statusTarget === 'REJECTED') && (
                <div className="grid gap-1">
                  <div className="text-xs text-[rgb(var(--tc-muted))]">Причина (optional)</div>
                  <textarea
                    className="min-h-[70px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                </div>
              )}
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                Примечание: вернуть в PENDING или снять isVerified через API сейчас нельзя.
              </div>
            </div>
          )}
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

      <Modal open={settingsOpen} title="Settings (JSON)" onClose={() => setSettingsOpen(false)}>
        <div className="grid gap-3">
          {settingsError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{settingsError}</Card>
          )}
          <textarea
            className="min-h-[220px] w-full rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-3 font-mono text-xs"
            value={settingsText}
            onChange={(e) => setSettingsText(e.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setSettingsOpen(false)}
              disabled={settingsLoading}
            >
              Cancel
            </Button>
            <Button onClick={onSaveSettings} disabled={settingsLoading}>
              {settingsLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={docsOpen} title="Документы бренда" onClose={() => setDocsOpen(false)}>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              brandId: <span className="font-mono">{docsBrandId ?? '-'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={openUploadDoc} disabled={!docsBrandId}>
                Upload
              </Button>
              <Button variant="secondary" onClick={refreshDocuments} disabled={docsLoading}>
                Refresh
              </Button>
            </div>
          </div>

          {docsError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{docsError}</Card>
          )}

          <div className="overflow-auto rounded-2xl border border-[rgb(var(--tc-border))]">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] text-left">
                  <th className="px-4 py-3 font-semibold">Тип</th>
                  <th className="px-4 py-3 font-semibold">Название</th>
                  <th className="px-4 py-3 font-semibold">Verified</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docsLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-[rgb(var(--tc-muted))]" colSpan={5}>
                      Загрузка...
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[rgb(var(--tc-muted))]" colSpan={5}>
                      Нет документов
                    </td>
                  </tr>
                ) : (
                  docs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-[rgb(var(--tc-border))] last:border-b-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{d.type}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{d.name}</div>
                        <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
                          <span className="font-mono">{d.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            d.isVerified
                              ? 'text-[rgb(var(--tc-success))]'
                              : 'text-[rgb(var(--tc-muted))]'
                          }
                        >
                          {d.isVerified ? 'yes' : 'no'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[rgb(var(--tc-muted))]">
                        {new Date(d.uploadedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <a
                            className="rounded-lg px-3 py-2 text-sm hover:bg-[rgb(var(--tc-surface-2))]"
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                          {!d.isVerified && (
                            <Button
                              variant="secondary"
                              className="px-3 py-2"
                              onClick={() => openVerifyDoc(d.id)}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            className="px-3 py-2"
                            onClick={() => openDeleteDoc(d.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        open={docUploadOpen}
        title="Загрузить документ"
        onClose={() => setDocUploadOpen(false)}
      >
        <div className="grid gap-3">
          {docUploadError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{docUploadError}</Card>
          )}
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Type *</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={docUploadType}
              onChange={(e) => setDocUploadType(e.target.value as BrandDocument['type'])}
            >
              {[
                'REGISTRATION',
                'LICENSE',
                'CONTRACT',
                'TAX_CERTIFICATE',
                'BANK_STATEMENT',
                'OTHER',
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Name *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={docUploadName}
              onChange={(e) => setDocUploadName(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">File *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              type="file"
              onChange={(e) => setDocUploadFile(e.target.files?.item(0) ?? null)}
            />
            {docUploadFile && (
              <div className="text-xs text-[rgb(var(--tc-muted))]">{docUploadFile.name}</div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDocUploadOpen(false)}
              disabled={docUploadLoading}
            >
              Cancel
            </Button>
            <Button onClick={onConfirmUploadDoc} disabled={docUploadLoading}>
              {docUploadLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={cafesOpen}
        title="Cafes бренда"
        onClose={() => setCafesOpen(false)}
        size="2xl"
        bodyClassName="max-h-[calc(100vh-8rem)]"
      >
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              brandId: <span className="font-mono">{cafesBrandId ?? '-'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => cafesBrandId && refreshCafes(cafesBrandId, cafesPage, cafesLimit)}
                disabled={cafesLoading}
              >
                Refresh
              </Button>
              <Button onClick={openCafeCreate} disabled={!cafesBrandId}>
                Add cafe
              </Button>
            </div>
          </div>

          {cafesError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{cafesError}</Card>
          )}

          <DataTable
            rows={cafes}
            columns={[
              {
                key: 'name',
                header: 'Название',
                render: (c) => <div className="font-medium">{c.name}</div>,
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
                      onClick={() => openCafeEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-2"
                      onClick={() => openCafeDelete(c)}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            getRowId={(c) => c.id}
            isLoading={cafesLoading}
            error={null}
            page={cafesPage}
            pageSize={cafesLimit}
            total={cafesTotal}
            onPageChange={(p) =>
              cafesBrandId && refreshCafes(cafesBrandId, Math.max(1, p), cafesLimit)
            }
            onPageSizeChange={(s) => cafesBrandId && refreshCafes(cafesBrandId, 1, s)}
          />
        </div>
      </Modal>

      <Modal
        open={cafeEditOpen}
        title={cafeEditId ? 'Редактировать cafe' : 'Создать cafe'}
        onClose={() => setCafeEditOpen(false)}
      >
        <div className="grid gap-3">
          {cafeSaveError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{cafeSaveError}</Card>
          )}
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Name *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={cafeForm.name}
              onChange={(e) => setCafeForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Address *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={cafeForm.address}
              onChange={(e) => setCafeForm((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">City *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={cafeForm.city}
              onChange={(e) => setCafeForm((s) => ({ ...s, city: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Region ID *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={cafeForm.regionId}
              onChange={(e) => setCafeForm((s) => ({ ...s, regionId: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">Latitude *</div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
                value={cafeForm.latitude}
                onChange={(e) => setCafeForm((s) => ({ ...s, latitude: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">Longitude *</div>
              <input
                className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
                value={cafeForm.longitude}
                onChange={(e) => setCafeForm((s) => ({ ...s, longitude: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Cafe API URL</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={cafeForm.cafeApiUrl}
              onChange={(e) => setCafeForm((s) => ({ ...s, cafeApiUrl: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Photos (one URL per line)</div>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={cafeForm.photosText}
              onChange={(e) => setCafeForm((s) => ({ ...s, photosText: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Description</div>
            <textarea
              className="min-h-[90px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={cafeForm.description}
              onChange={(e) => setCafeForm((s) => ({ ...s, description: e.target.value }))}
            />
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setCafeEditOpen(false)}
              disabled={cafeSaveLoading}
            >
              Cancel
            </Button>
            <Button onClick={onSaveCafe} disabled={cafeSaveLoading}>
              {cafeSaveLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={cafeDeleteOpen}
        title="Удалить cafe?"
        description="Точно хотите удалить кафе?"
        confirmText="Удалить"
        isDanger
        isLoading={cafeDeleteLoading}
        onClose={() => setCafeDeleteOpen(false)}
        onConfirm={onConfirmDeleteCafe}
      />

      <Modal open={apiKeysOpen} title="API Keys бренда" onClose={() => setApiKeysOpen(false)}>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              brandId: <span className="font-mono">{apiKeysBrandId ?? '-'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => apiKeysBrandId && refreshApiKeys(apiKeysBrandId)}
                disabled={apiKeysLoading}
              >
                Refresh
              </Button>
              <Button onClick={openApiKeyCreate} disabled={!apiKeysBrandId}>
                Add key
              </Button>
            </div>
          </div>

          {apiKeysError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{apiKeysError}</Card>
          )}

          {apiKeyCreated && (
            <Card className="p-4">
              <div className="text-sm font-semibold">API key (показывается один раз)</div>
              <div className="mt-2 rounded-xl bg-[rgb(var(--tc-surface-2))] p-3 font-mono text-xs">
                {apiKeyCreated.key}
              </div>
            </Card>
          )}

          <div className="overflow-auto rounded-2xl border border-[rgb(var(--tc-border))]">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] text-left">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Prefix</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeysLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-[rgb(var(--tc-muted))]" colSpan={5}>
                      Загрузка...
                    </td>
                  </tr>
                ) : apiKeys.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[rgb(var(--tc-muted))]" colSpan={5}>
                      Нет ключей
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((k) => (
                    <tr
                      key={k.id}
                      className="border-b border-[rgb(var(--tc-border))] last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{k.name}</div>
                        <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
                          <span className="font-mono">{k.id}</span>
                        </div>
                        <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
                          permissions: <span className="font-mono">{k.permissions.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{k.prefix}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            k.isActive
                              ? 'text-[rgb(var(--tc-success))]'
                              : 'text-[rgb(var(--tc-muted))]'
                          }
                        >
                          {k.isActive ? 'yes' : 'no'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[rgb(var(--tc-muted))]">
                        {k.expiresAt ? new Date(k.expiresAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="px-3 py-2"
                            onClick={() => openApiKeyEdit(k)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            className="px-3 py-2"
                            onClick={() => openApiKeyDelete(k)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        open={apiKeyEditOpen}
        title={apiKeyEditId ? 'Редактировать API key' : 'Создать API key'}
        onClose={() => setApiKeyEditOpen(false)}
      >
        <div className="grid gap-3">
          {apiKeySaveError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{apiKeySaveError}</Card>
          )}
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Name *</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={apiKeyForm.name}
              onChange={(e) => setApiKeyForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              Permissions * (one per line or comma-separated)
            </div>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={apiKeyForm.permissionsText}
              onChange={(e) => setApiKeyForm((s) => ({ ...s, permissionsText: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              ExpiresAt (ISO) / empty = no change
            </div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={apiKeyForm.expiresAt}
              onChange={(e) => setApiKeyForm((s) => ({ ...s, expiresAt: e.target.value }))}
              placeholder="2026-12-31T23:59:59.000Z"
              disabled={apiKeyForm.clearExpires}
            />
          </div>
          {apiKeyEditId && (
            <label className="flex items-center gap-2 text-sm text-[rgb(var(--tc-muted))]">
              <input
                type="checkbox"
                checked={apiKeyForm.isActive}
                onChange={(e) => setApiKeyForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              Active
            </label>
          )}
          {apiKeyEditId && (
            <label className="flex items-center gap-2 text-sm text-[rgb(var(--tc-muted))]">
              <input
                type="checkbox"
                checked={apiKeyForm.clearExpires}
                onChange={(e) => setApiKeyForm((s) => ({ ...s, clearExpires: e.target.checked }))}
              />
              Clear expiresAt (set null)
            </label>
          )}

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setApiKeyEditOpen(false)}
              disabled={apiKeySaveLoading}
            >
              Cancel
            </Button>
            <Button onClick={onSaveApiKey} disabled={apiKeySaveLoading}>
              {apiKeySaveLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={apiKeyDeleteOpen}
        title="Удалить API key?"
        description="Точно хотите отозвать ключ?"
        confirmText="Удалить"
        isDanger
        isLoading={apiKeyDeleteLoading}
        onClose={() => setApiKeyDeleteOpen(false)}
        onConfirm={onConfirmDeleteApiKey}
      />

      <Modal
        open={workersOpen}
        title="Workers бренда (view only)"
        onClose={() => setWorkersOpen(false)}
        size="2xl"
        bodyClassName="max-h-[calc(100vh-8rem)]"
      >
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              brandId: <span className="font-mono">{workersBrandId ?? '-'}</span>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                workersBrandId && refreshWorkers(workersBrandId, workersPage, workersLimit)
              }
              disabled={workersLoading}
            >
              Refresh
            </Button>
          </div>

          {workersError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{workersError}</Card>
          )}

          <DataTable
            rows={workers}
            columns={[
              {
                key: 'name',
                header: 'ФИО',
                render: (w) => (
                  <div>
                    <div className="font-medium">
                      {w.firstName} {w.lastName}
                    </div>
                    <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">{w.email}</div>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Role',
                render: (w) => <span className="font-mono text-xs">{w.role}</span>,
              },
              {
                key: 'cafe',
                header: 'CafeId',
                render: (w) => (
                  <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">
                    {w.cafeId ?? '-'}
                  </span>
                ),
              },
              {
                key: 'created',
                header: 'Created',
                render: (w) => (
                  <span className="text-xs text-[rgb(var(--tc-muted))]">
                    {new Date(w.createdAt).toLocaleString()}
                  </span>
                ),
              },
            ]}
            getRowId={(w) => w.id}
            isLoading={workersLoading}
            error={null}
            page={workersPage}
            pageSize={workersLimit}
            total={workersTotal}
            onPageChange={(p) =>
              workersBrandId && refreshWorkers(workersBrandId, Math.max(1, p), workersLimit)
            }
            onPageSizeChange={(s) => workersBrandId && refreshWorkers(workersBrandId, 1, s)}
          />
        </div>
      </Modal>

      <Modal
        open={docVerifyOpen}
        title="Верифицировать документ"
        onClose={() => setDocVerifyOpen(false)}
      >
        <div className="grid gap-3">
          {docVerifyError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{docVerifyError}</Card>
          )}
          <div className="text-xs text-[rgb(var(--tc-muted))]">
            docId: <span className="font-mono">{docVerifyId ?? '-'}</span>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Verification note (optional)</div>
            <textarea
              className="min-h-[90px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={docVerifyNote}
              onChange={(e) => setDocVerifyNote(e.target.value)}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDocVerifyOpen(false)}
              disabled={docVerifyLoading}
            >
              Cancel
            </Button>
            <Button onClick={onConfirmVerifyDoc} disabled={docVerifyLoading}>
              {docVerifyLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={docDeleteOpen}
        title="Удалить документ?"
        description="Точно хотите удалить файл и запись документа?"
        confirmText="Удалить"
        isDanger
        isLoading={docDeleteLoading}
        onClose={() => setDocDeleteOpen(false)}
        onConfirm={onConfirmDeleteDoc}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Удалить бренд?"
        description="Точно хотите удалить? Это soft delete в базе."
        confirmText="Удалить"
        isDanger
        isLoading={deleteLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

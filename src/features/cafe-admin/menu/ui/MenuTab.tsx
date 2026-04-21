'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Badge } from '@/shared/ui/badge/Badge';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';
import { getMyCafe } from '../../cafe/api/cafe-api';
import {
  createMenuCategoryAdmin,
  createMenuItemAdmin,
  deleteMenuCategoryAdmin,
  deleteMenuItemAdmin,
  exportCafeMenuAdmin,
  getCafeMenuAdmin,
  importCafeMenuAdmin,
  updateMenuCategoryAdmin,
  updateMenuItemAdmin,
} from '@/features/menu/api/menu-api';
import type {
  CafeMenuCategory,
  CafeMenuItem,
  CafeMenuJsonV1,
  CafeMenuResponse,
} from '@/features/menu/types/menu.types';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';

type ImportMode = 'merge' | 'replace';

function toNumberOr(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function MenuTab({ cafeId: cafeIdProp }: { cafeId?: string } = {}) {
  const [cafeId, setCafeId] = useState<string | null>(cafeIdProp ?? null);
  const [menu, setMenu] = useState<CafeMenuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import / export
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importRaw, setImportRaw] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CafeMenuCategory | null>(null);
  const [categoryKey, setCategoryKey] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categorySortOrder, setCategorySortOrder] = useState('0');
  const [categoryIsActive, setCategoryIsActive] = useState(true);

  // Item modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CafeMenuItem | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemKey, setItemKey] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCurrency, setItemCurrency] = useState('BYN');
  const [itemPhotoUrl, setItemPhotoUrl] = useState('');
  const [itemSortOrder, setItemSortOrder] = useState('0');
  const [itemIsActive, setItemIsActive] = useState(true);

  // Delete confirms
  const [deleteCategory, setDeleteCategory] = useState<CafeMenuCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<CafeMenuItem | null>(null);

  const categories = useMemo(() => menu?.categories ?? [], [menu]);
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: `${c.name} (${c.key})` })),
    [categories],
  );

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resolvedCafeId = cafeIdProp ?? (await getMyCafe()).id;
      setCafeId(resolvedCafeId);
      const menuData = await getCafeMenuAdmin({
        cafeId: resolvedCafeId,
        includeInactive: true,
      });
      setMenu(menuData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load menu');
      setMenu(null);
    } finally {
      setLoading(false);
    }
  }, [cafeIdProp]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryKey('');
    setCategoryName('');
    setCategoryDescription('');
    setCategorySortOrder('0');
    setCategoryIsActive(true);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (c: CafeMenuCategory) => {
    setEditingCategory(c);
    setCategoryKey(c.key);
    setCategoryName(c.name);
    setCategoryDescription(c.description ?? '');
    setCategorySortOrder(String(c.sortOrder ?? 0));
    setCategoryIsActive(!!c.isActive);
    setCategoryModalOpen(true);
  };

  const submitCategory = async () => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    try {
      if (editingCategory) {
        await updateMenuCategoryAdmin({
          cafeId,
          categoryId: editingCategory.id,
          name: categoryName.trim() || undefined,
          description: categoryDescription.trim() ? categoryDescription.trim() : null,
          sortOrder: toNumberOr(categorySortOrder, editingCategory.sortOrder ?? 0),
          isActive: categoryIsActive,
        });
      } else {
        await createMenuCategoryAdmin({
          cafeId,
          key: categoryKey.trim(),
          name: categoryName.trim(),
          description: categoryDescription.trim() ? categoryDescription.trim() : null,
          sortOrder: toNumberOr(categorySortOrder, 0),
          isActive: categoryIsActive,
        });
      }
      setCategoryModalOpen(false);
      await loadMenu();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const openCreateItem = (categoryId?: string) => {
    setEditingItem(null);
    setItemCategoryId(categoryId ?? categoryOptions[0]?.id ?? '');
    setItemKey('');
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemCurrency('BYN');
    setItemPhotoUrl('');
    setItemSortOrder('0');
    setItemIsActive(true);
    setItemModalOpen(true);
  };

  const openEditItem = (i: CafeMenuItem) => {
    setEditingItem(i);
    setItemCategoryId(i.categoryId);
    setItemKey(i.key);
    setItemName(i.name);
    setItemDescription(i.description ?? '');
    setItemPrice(i.price);
    setItemCurrency(i.currency || 'BYN');
    setItemPhotoUrl(i.photoUrl ?? '');
    setItemSortOrder(String(i.sortOrder ?? 0));
    setItemIsActive(!!i.isActive);
    setItemModalOpen(true);
  };

  const submitItem = async () => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    try {
      const priceNum = toNumberOr(itemPrice, NaN);
      if (!Number.isFinite(priceNum) || priceNum < 0)
        throw new Error('Цена должна быть числом ≥ 0');

      if (editingItem) {
        await updateMenuItemAdmin({
          cafeId,
          itemId: editingItem.id,
          categoryId: itemCategoryId || undefined,
          name: itemName.trim() || undefined,
          description: itemDescription.trim() ? itemDescription.trim() : null,
          price: priceNum,
          currency: itemCurrency.trim() || 'BYN',
          photoUrl: itemPhotoUrl.trim() ? itemPhotoUrl.trim() : null,
          sortOrder: toNumberOr(itemSortOrder, editingItem.sortOrder ?? 0),
          isActive: itemIsActive,
        });
      } else {
        await createMenuItemAdmin({
          cafeId,
          categoryId: itemCategoryId,
          key: itemKey.trim(),
          name: itemName.trim(),
          description: itemDescription.trim() ? itemDescription.trim() : null,
          price: priceNum,
          currency: itemCurrency.trim() || 'BYN',
          photoUrl: itemPhotoUrl.trim() ? itemPhotoUrl.trim() : null,
          sortOrder: toNumberOr(itemSortOrder, 0),
          isActive: itemIsActive,
        });
      }
      setItemModalOpen(false);
      await loadMenu();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    try {
      const json = await exportCafeMenuAdmin(cafeId);
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menu-${cafeId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export menu');
    } finally {
      setLoading(false);
    }
  };

  const onPickImportFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setImportRaw(text);
    setImportError(null);
  };

  const onImport = async () => {
    if (!cafeId) return;
    setImportError(null);
    let parsed: CafeMenuJsonV1;
    try {
      parsed = JSON.parse(importRaw);
    } catch {
      setImportError('Не удалось распарсить JSON');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await importCafeMenuAdmin({ cafeId, mode: importMode, menu: parsed });
      setMenu(res);
      setImportOpen(false);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !menu) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-[rgb(var(--tc-muted))]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Menu</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Редактирование меню вашей кофейни. Категорий: {categories.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadMenu} disabled={loading}>
            Refresh
          </Button>
          <Button variant="secondary" onClick={onExport} disabled={loading || !cafeId}>
            Export JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => setImportOpen(true)}
            disabled={loading || !cafeId}
          >
            Import JSON
          </Button>
          <Button variant="primary" onClick={openCreateCategory} disabled={loading || !cafeId}>
            Add category
          </Button>
          <Button
            variant="primary"
            onClick={() => openCreateItem()}
            disabled={loading || !cafeId || categories.length === 0}
          >
            Add item
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      )}

      {categories.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--tc-muted))]">
            Меню пустое. Добавь категорию или импортируй JSON.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold">{c.name}</div>
                    <Badge
                      className={
                        c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-[rgb(var(--tc-muted))]">key: {c.key}</span>
                  </div>
                  {c.description && (
                    <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">{c.description}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => openCreateItem(c.id)}
                  >
                    Add item
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => openEditCategory(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    className="text-xs bg-[rgb(var(--tc-danger))] hover:bg-[rgb(var(--tc-danger))]/90"
                    onClick={() => setDeleteCategory(c)}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                {c.items.length === 0 ? (
                  <div className="text-sm text-[rgb(var(--tc-muted))]">Нет позиций</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgb(var(--tc-border))]">
                          <th className="py-2 text-left text-xs font-semibold">Name</th>
                          <th className="py-2 text-left text-xs font-semibold">Price</th>
                          <th className="py-2 text-left text-xs font-semibold">Key</th>
                          <th className="py-2 text-left text-xs font-semibold">Status</th>
                          <th className="py-2 text-right text-xs font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.items.map((i) => (
                          <tr key={i.id} className="border-b border-[rgb(var(--tc-border))]">
                            <td className="py-2 pr-2 text-sm">
                              <div className="font-medium">{i.name}</div>
                              {i.description && (
                                <div className="text-xs text-[rgb(var(--tc-muted))]">
                                  {i.description}
                                </div>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-sm">
                              <MoneyAmount value={i.price} />
                            </td>
                            <td className="py-2 pr-2 text-xs text-[rgb(var(--tc-muted))]">
                              {i.key}
                            </td>
                            <td className="py-2 pr-2">
                              <Badge
                                className={
                                  i.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700'
                                }
                              >
                                {i.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="secondary"
                                  className="text-xs"
                                  onClick={() => openEditItem(i)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  className="text-xs bg-[rgb(var(--tc-danger))] hover:bg-[rgb(var(--tc-danger))]/90"
                                  onClick={() => setDeleteItem(i)}
                                >
                                  Deactivate
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Import modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import menu JSON"
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onImport} disabled={loading || !importRaw.trim()}>
              Import
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Mode</label>
            <select
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as ImportMode)}
            >
              <option value="merge">merge</option>
              <option value="replace">replace</option>
            </select>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => onPickImportFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <textarea
            className="h-64 w-full rounded-lg border border-[rgb(var(--tc-border))] bg-transparent p-3 font-mono text-xs"
            placeholder='{"version":1,"categories":[...],"items":[...]}'
            value={importRaw}
            onChange={(e) => setImportRaw(e.target.value)}
          />

          {importError && <div className="text-sm text-red-700">{importError}</div>}
        </div>
      </Modal>

      {/* Category modal */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? 'Edit category' : 'Add category'}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setCategoryModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitCategory}
              disabled={
                loading || (!editingCategory && (!categoryKey.trim() || !categoryName.trim()))
              }
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Key</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              disabled={!!editingCategory}
              placeholder="coffee"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Coffee"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Description</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Sort order</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={categorySortOrder}
              onChange={(e) => setCategorySortOrder(e.target.value)}
              placeholder="0"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={categoryIsActive}
              onChange={(e) => setCategoryIsActive(e.target.checked)}
            />
            Active
          </label>
        </div>
      </Modal>

      {/* Item modal */}
      <Modal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? 'Edit item' : 'Add item'}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setItemModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitItem}
              disabled={
                loading ||
                (!editingItem &&
                  (!itemCategoryId.trim() ||
                    !itemKey.trim() ||
                    !itemName.trim() ||
                    !itemPrice.trim()))
              }
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Category</label>
            <select
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={itemCategoryId}
              onChange={(e) => setItemCategoryId(e.target.value)}
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Key</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={itemKey}
              onChange={(e) => setItemKey(e.target.value)}
              disabled={!!editingItem}
              placeholder="latte"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Latte"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Description</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Price</label>
              <input
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="290"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Currency</label>
              <input
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
                value={itemCurrency}
                onChange={(e) => setItemCurrency(e.target.value)}
                placeholder="BYN"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Sort order</label>
              <input
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
                value={itemSortOrder}
                onChange={(e) => setItemSortOrder(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Photo URL</label>
            <input
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
              value={itemPhotoUrl}
              onChange={(e) => setItemPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={itemIsActive}
              onChange={(e) => setItemIsActive(e.target.checked)}
            />
            Active
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteCategory}
        title="Deactivate category?"
        description={
          deleteCategory
            ? `Категория "${deleteCategory.name}" и все её позиции будут деактивированы.`
            : undefined
        }
        confirmText="Deactivate"
        cancelText="Cancel"
        isDanger
        isLoading={loading}
        onCancel={() => setDeleteCategory(null)}
        onConfirm={async () => {
          if (!cafeId || !deleteCategory) return;
          setLoading(true);
          setError(null);
          try {
            await deleteMenuCategoryAdmin({ cafeId, categoryId: deleteCategory.id });
            setDeleteCategory(null);
            await loadMenu();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to deactivate category');
          } finally {
            setLoading(false);
          }
        }}
      />

      <ConfirmModal
        open={!!deleteItem}
        title="Deactivate item?"
        description={deleteItem ? `Позиция "${deleteItem.name}" будет деактивирована.` : undefined}
        confirmText="Deactivate"
        cancelText="Cancel"
        isDanger
        isLoading={loading}
        onCancel={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (!cafeId || !deleteItem) return;
          setLoading(true);
          setError(null);
          try {
            await deleteMenuItemAdmin({ cafeId, itemId: deleteItem.id });
            setDeleteItem(null);
            await loadMenu();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to deactivate item');
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}

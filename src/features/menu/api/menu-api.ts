import { clientFetch } from '@/shared/lib/client-fetch';
import type { CafeMenuJsonV1, CafeMenuResponse } from '../types/menu.types';

export async function getCafeMenuAdmin(params: {
  cafeId: string;
  includeInactive?: boolean;
}): Promise<CafeMenuResponse> {
  const { cafeId, includeInactive } = params;
  const qs = includeInactive ? '?includeInactive=1' : '';
  return clientFetch(`/api/admin/cafes/${cafeId}/menu${qs}`);
}

export async function exportCafeMenuAdmin(cafeId: string): Promise<CafeMenuJsonV1> {
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/export`);
}

export async function importCafeMenuAdmin(params: {
  cafeId: string;
  mode?: 'merge' | 'replace';
  menu: CafeMenuJsonV1;
}): Promise<CafeMenuResponse> {
  const { cafeId, mode, menu } = params;
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/import`, {
    method: 'POST',
    body: JSON.stringify({ mode, menu }),
  });
}

export async function createMenuCategoryAdmin(params: {
  cafeId: string;
  key: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { cafeId, ...body } = params;
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/categories`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMenuCategoryAdmin(params: {
  cafeId: string;
  categoryId: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { cafeId, categoryId, ...body } = params;
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteMenuCategoryAdmin(params: { cafeId: string; categoryId: string }) {
  const { cafeId, categoryId } = params;
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

export async function createMenuItemAdmin(params: {
  cafeId: string;
  categoryId: string;
  key: string;
  name: string;
  description?: string | null;
  price: number;
  currency?: string;
  photoUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { cafeId, ...body } = params;
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/items`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMenuItemAdmin(params: {
  cafeId: string;
  itemId: string;
  categoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  photoUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { cafeId, itemId, ...body } = params;
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteMenuItemAdmin(params: { cafeId: string; itemId: string }) {
  const { cafeId, itemId } = params;
  return clientFetch(`/api/admin/cafes/${cafeId}/menu/items/${itemId}`, {
    method: 'DELETE',
  });
}

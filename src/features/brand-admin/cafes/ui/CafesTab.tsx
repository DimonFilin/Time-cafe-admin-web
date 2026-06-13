'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Badge } from '@/shared/ui/badge/Badge';
import { CafeFormModal } from './CafeFormModal';
import { CafeDeleteModal } from './CafeDeleteModal';
import { t } from '@/i18n';

interface Cafe {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  street?: string;
  latitude: number;
  longitude: number;
  photos?: string[];
  rating?: number;
  reviewsCount?: number;
  brandId: string;
  regionId: string;
  cafeApiUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Region {
  id: string;
  name: string;
  country: string;
}

function formatCreatedAt(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
}

export function CafesTab() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCafe, setDeletingCafe] = useState<Cafe | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    fetchCafes();
    fetchRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchCafes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/brand/cafes?page=${page}&limit=${pageSize}`);
      if (!response.ok) throw new Error(t('brandAdmin.cafes.fetchFailed'));
      const data = await response.json();
      setCafes(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('brandAdmin.cafes.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/brand/regions');
      if (!response.ok) return;

      const data = await response.json();
      const regionsList = data.items || (Array.isArray(data) ? data : []);
      setRegions(regionsList);
    } catch {
      // regions are optional
    }
  };

  const handleCreateCafe = async (data: Partial<Cafe>) => {
    const response = await fetch('/api/brand/cafes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || t('brandAdmin.cafes.createFailed'));
    }

    const newCafe = await response.json();
    setCafes([newCafe, ...cafes]);
    setCreateOpen(false);
  };

  const handleEditCafe = async (data: Partial<Cafe>) => {
    if (!editingCafe) return;

    const response = await fetch(`/api/brand/cafes/${editingCafe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || t('brandAdmin.cafes.updateFailed'));
    }

    const updatedCafe = await response.json();
    setCafes(cafes.map((c) => (c.id === editingCafe.id ? updatedCafe : c)));
    setEditingCafe(null);
  };

  const handleDeleteCafe = async () => {
    if (!deletingCafe) return;

    const response = await fetch(`/api/brand/cafes/${deletingCafe.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error(t('brandAdmin.cafes.deleteFailed'));

    setCafes(cafes.filter((c) => c.id !== deletingCafe.id));
    setDeleteOpen(false);
    setDeletingCafe(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-32 animate-pulse rounded bg-[rgb(var(--tc-border))]" />
        <div className="h-64 animate-pulse rounded bg-[rgb(var(--tc-border))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('brandAdmin.cafes.title')}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.cafes.subtitlePrefix')} {cafes.length}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} variant="primary">
          {t('brandAdmin.cafes.createCafe')}
        </Button>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden">
        {cafes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[rgb(var(--tc-muted))]">{t('brandAdmin.cafes.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgb(var(--tc-border))]">
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('common.name')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('common.city')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t('common.address')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t('common.rating')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t('workers.created')}
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {cafes.map((cafe) => (
                  <tr
                    key={cafe.id}
                    className="border-b border-[rgb(var(--tc-border))] hover:bg-background"
                  >
                    <td className="px-6 py-4 text-sm font-medium">{cafe.name}</td>
                    <td className="px-6 py-4 text-sm">{cafe.city}</td>
                    <td className="px-6 py-4 text-sm text-[rgb(var(--tc-muted))]">
                      {cafe.address}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {cafe.rating ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          ★ {cafe.rating.toFixed(1)}
                        </Badge>
                      ) : (
                        <span className="text-[rgb(var(--tc-muted))]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[rgb(var(--tc-muted))]">
                      {formatCreatedAt(cafe.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => setEditingCafe(cafe)}
                          variant="secondary"
                          className="text-xs"
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          onClick={() => {
                            setDeletingCafe(cafe);
                            setDeleteOpen(true);
                          }}
                          className="text-xs bg-red-600 hover:bg-red-700"
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            variant="secondary"
            disabled={page === 1}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <Button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            variant="secondary"
            disabled={page === totalPages}
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      <CafeFormModal
        cafe={editingCafe}
        regions={regions}
        isOpen={createOpen || !!editingCafe}
        onClose={() => {
          setCreateOpen(false);
          setEditingCafe(null);
        }}
        onSave={editingCafe ? handleEditCafe : handleCreateCafe}
      />

      <CafeDeleteModal
        cafe={deletingCafe}
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingCafe(null);
        }}
        onConfirm={handleDeleteCafe}
      />
    </div>
  );
}

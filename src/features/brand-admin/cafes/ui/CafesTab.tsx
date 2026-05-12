'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Badge } from '@/shared/ui/badge/Badge';
import { CafeFormModal } from './CafeFormModal';
import { CafeDeleteModal } from './CafeDeleteModal';

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
      if (!response.ok) throw new Error('Failed to fetch cafes');
      const data = await response.json();
      setCafes(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch cafes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/brand/regions');
      if (!response.ok) return;

      const data = await response.json();
      // Handle both { items: [...] } and direct array formats
      const regionsList = data.items || (Array.isArray(data) ? data : []);
      setRegions(regionsList);
    } catch {
      // Don't propagate - regions are optional
    }
  };

  const handleCreateCafe = async (data: Partial<Cafe>) => {
    try {
      const response = await fetch('/api/brand/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create cafe');
      }

      const newCafe = await response.json();
      setCafes([newCafe, ...cafes]);
      setCreateOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleEditCafe = async (data: Partial<Cafe>) => {
    if (!editingCafe) return;

    try {
      const response = await fetch(`/api/brand/cafes/${editingCafe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update cafe');
      }

      const updatedCafe = await response.json();
      setCafes(cafes.map((c) => (c.id === editingCafe.id ? updatedCafe : c)));
      setEditingCafe(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteCafe = async () => {
    if (!deletingCafe) return;

    try {
      const response = await fetch(`/api/brand/cafes/${deletingCafe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete cafe');

      setCafes(cafes.filter((c) => c.id !== deletingCafe.id));
      setDeleteOpen(false);
      setDeletingCafe(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cafe');
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Cafes</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Manage cafes for your brand. Total: {cafes.length}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} variant="primary">
          Create Cafe
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Cafes Table */}
      <Card className="overflow-hidden">
        {cafes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[rgb(var(--tc-muted))]">No cafes yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgb(var(--tc-border))]">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">City</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
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
                      {new Date(cafe.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => setEditingCafe(cafe)}
                          variant="secondary"
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            setDeletingCafe(cafe);
                            setDeleteOpen(true);
                          }}
                          className="text-xs bg-red-600 hover:bg-red-700"
                        >
                          Delete
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            variant="secondary"
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            variant="secondary"
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
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

      {/* Delete Confirmation Modal */}
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

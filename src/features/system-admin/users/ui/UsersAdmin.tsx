'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { User, UserListQuery } from '@/entities/user/types/user';
import { deleteUser, listUsers, updateUser } from '../api/users';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';

type UserFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  balanceDelta: string;
};

function toForm(u?: User | null): UserFormState {
  return {
    firstName: u?.firstName ?? '',
    lastName: u?.lastName ?? '',
    phone: u?.phone ?? '',
    avatar: u?.avatar ?? '',
    balanceDelta: '',
  };
}

export function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    email: '',
    firstName: '',
    includeDeleted: false,
  });

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UserFormState>(() => toForm(null));
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: UserListQuery = {
        page,
        limit: 20,
        email: filters.email.trim() || undefined,
        firstName: filters.firstName.trim() || undefined,
        includeDeleted: filters.includeDeleted || undefined,
      };
      const data = await listUsers(query);
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEdit = useCallback(async () => {
    if (!editingUser || !editForm.firstName.trim() || !editForm.lastName.trim()) return;

    setEditLoading(true);
    setEditError(null);
    try {
      const balanceDelta =
        editForm.balanceDelta.trim() === '' ? undefined : Number(editForm.balanceDelta);

      await updateUser(editingUser.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim() || undefined,
        avatar: editForm.avatar.trim() || undefined,
        balanceDelta:
          balanceDelta !== undefined && Number.isFinite(balanceDelta) ? balanceDelta : undefined,
      });
      setEditOpen(false);
      setEditingUser(null);
      setEditForm(toForm(null));
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  }, [editingUser, editForm, refresh]);

  const handleDelete = useCallback(async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      await deleteUser(deletingUser.id);
      setDeleteOpen(false);
      setDeletingUser(null);
      await refresh();
    } catch {
      // Error will be shown in modal
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingUser, refresh]);

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        key: 'id',
        header: 'ID',
        render: (u) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{u.id}</span>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        render: (u) => <span className="font-medium">{u.email}</span>,
      },
      {
        key: 'name',
        header: 'Name',
        render: (u) => (
          <span>
            {u.firstName} {u.lastName}
          </span>
        ),
      },
      {
        key: 'balance',
        header: 'Balance',
        render: (u) => <span className="font-mono">{Number(u.balance).toFixed(2)} BYN</span>,
      },
      {
        key: 'deleted',
        header: 'Deleted',
        render: (u) => (
          <input
            type="checkbox"
            checked={!!u.deletedAt}
            readOnly
            className="h-4 w-4 accent-[rgb(var(--tc-accent))]"
          />
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (u) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(u.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (u) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingUser(u);
                setEditForm(toForm(u));
                setEditError(null);
                setEditOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setDeletingUser(u);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Users (SYSTEM_ADMIN)</div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Manage users. Users are created through registration, but can be edited and deleted
            here.
          </div>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Email</div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.email}
              onChange={(e) => setFilters((s) => ({ ...s, email: e.target.value }))}
              placeholder="Filter by email"
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">First Name</div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.firstName}
              onChange={(e) => setFilters((s) => ({ ...s, firstName: e.target.value }))}
              placeholder="Filter by first name"
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Include Deleted</div>
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
        rows={users}
        columns={columns}
        getRowId={(u) => u.id}
        isLoading={loading}
        error={null}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={() => {}}
      />

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title="Edit User"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editLoading || !editForm.firstName.trim() || !editForm.lastName.trim()}
            >
              {editLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{editError}</Card>
          )}
          {editingUser && (
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-[rgb(var(--tc-muted))]">Email:</span>{' '}
                <span className="font-mono">{editingUser.email}</span>
              </div>
              <div>
                <span className="text-[rgb(var(--tc-muted))]">Current Balance:</span>{' '}
                <span className="font-mono">{Number(editingUser.balance).toFixed(2)} BYN</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              value={editForm.firstName}
              onChange={(e) => setEditForm((s) => ({ ...s, firstName: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input
              type="text"
              value={editForm.lastName}
              onChange={(e) => setEditForm((s) => ({ ...s, lastName: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="Last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="Phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Avatar URL</label>
            <input
              type="text"
              value={editForm.avatar}
              onChange={(e) => setEditForm((s) => ({ ...s, avatar: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="Avatar URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Balance Delta (positive = add, negative = subtract)
            </label>
            <input
              type="number"
              step="0.01"
              value={editForm.balanceDelta}
              onChange={(e) => setEditForm((s) => ({ ...s, balanceDelta: e.target.value }))}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={deleteOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${deletingUser?.email}"? This is a soft delete.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiKey, CreateApiKeyResponse } from '../api/api-keys';
import { listApiKeys, createApiKey, updateApiKey, revokeApiKey } from '../api/api-keys';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { CreateApiKeyModal, type CreateApiKeyFormData } from './CreateApiKeyModal';
import { EditApiKeyModal, type EditApiKeyFormData } from './EditApiKeyModal';
import { ShowKeyModal } from './ShowKeyModal';

interface ApiKeysTabProps {
  brandId: string;
}

export function ApiKeysTab({ brandId }: ApiKeysTabProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal state
  const [editKey, setEditKey] = useState<ApiKey | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Revoke confirmation state
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Show key state (after creation)
  const [showKey, setShowKey] = useState<CreateApiKeyResponse | null>(null);
  const [showKeyOpen, setShowKeyOpen] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listApiKeys(brandId);
      setKeys(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const onCreateKey = async (data: CreateApiKeyFormData) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await createApiKey(brandId, data);
      // Optimistically add created key to list so it appears immediately
      const newKey: ApiKey = {
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        isActive: created.isActive ?? true,
        createdAt: created.createdAt,
        updatedAt: created.createdAt, // Use createdAt as updatedAt since CreateApiKeyResponse doesn't have updatedAt
        lastUsedAt: (created as Partial<CreateApiKeyResponse>).lastUsedAt || undefined,
        expiresAt: (created as Partial<CreateApiKeyResponse>).expiresAt || undefined,
        permissions: created.permissions || [],
      };
      setKeys((ks) => [newKey, ...ks]);

      setShowKey(created);
      setShowKeyOpen(true);
      setCreateOpen(false);
      // Refresh from server to sync state (non-blocking)
      fetchKeys();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create API key');
    } finally {
      setCreateLoading(false);
    }
  };

  const onEditKey = async (data: EditApiKeyFormData) => {
    if (!editKey) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await updateApiKey(brandId, editKey.id, data);
      setEditOpen(false);
      await fetchKeys();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update API key');
    } finally {
      setEditLoading(false);
    }
  };

  const onConfirmRevoke = async () => {
    if (!revokeId) return;
    setRevokeLoading(true);
    try {
      await revokeApiKey(brandId, revokeId);
      setRevokeOpen(false);
      setRevokeId(null);
      await fetchKeys();
    } catch (e) {
      console.error('Failed to revoke API key:', e);
    } finally {
      setRevokeLoading(false);
    }
  };

  const columns: DataTableColumn<ApiKey>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (k) => <span className="text-sm font-medium">{k.name}</span>,
    },
    {
      key: 'prefix',
      header: 'Prefix',
      render: (k) => (
        <span className="text-sm font-mono text-[rgb(var(--tc-muted))]">{k.prefix}****</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (k) => {
        const isExpired = k.expiresAt && new Date(k.expiresAt) < new Date();
        const status = !k.isActive ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE';

        return (
          <span
            className={`text-sm px-2 py-1 rounded ${
              status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : status === 'REVOKED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (k) => (
        <span className="text-sm text-[rgb(var(--tc-muted))]">
          {new Date(k.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'lastUsedAt',
      header: 'Last Used',
      render: (k) =>
        k.lastUsedAt ? (
          <span className="text-sm text-[rgb(var(--tc-muted))]">
            {new Date(k.lastUsedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-[rgb(var(--tc-muted))]">Never</span>
        ),
    },
    {
      key: 'expiresAt',
      header: 'Expires At',
      render: (k) =>
        k.expiresAt ? (
          <span className="text-sm text-[rgb(var(--tc-muted))]">
            {new Date(k.expiresAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-[rgb(var(--tc-muted))]">Never</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (k) => {
        const isExpired = k.expiresAt && new Date(k.expiresAt) < new Date();
        const isActive = k.isActive && !isExpired;

        return (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditKey(k);
                setEditOpen(true);
                setEditError(null);
              }}
              disabled={!isActive}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRevokeId(k.id);
                setRevokeOpen(true);
              }}
              disabled={!isActive}
            >
              Revoke
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">API Keys</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Create and manage API keys for integrations.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateOpen(true);
            setCreateError(null);
          }}
        >
          + Create Key
        </Button>
      </div>

      {error && <Card className="p-3 text-sm text-red-700">{error}</Card>}

      <DataTable<ApiKey>
        rows={keys}
        columns={columns}
        getRowId={(k) => k.id}
        page={1}
        pageSize={keys.length || 10}
        total={keys.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        isLoading={loading}
        error={error}
      />

      <CreateApiKeyModal
        open={createOpen}
        loading={createLoading}
        error={createError || undefined}
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
        }}
        onSubmit={onCreateKey}
      />

      {editKey && (
        <EditApiKeyModal
          open={editOpen}
          key={editKey.id}
          apiKey={editKey}
          loading={editLoading}
          error={editError || undefined}
          onClose={() => {
            setEditOpen(false);
            setEditKey(null);
            setEditError(null);
          }}
          onSubmit={onEditKey}
        />
      )}

      <ConfirmModal
        open={revokeOpen}
        onClose={() => {
          setRevokeOpen(false);
          setRevokeId(null);
        }}
        onConfirm={onConfirmRevoke}
        title="Revoke API Key"
        message="Are you sure you want to revoke this API key? Applications using it will no longer have access."
        confirmText="Revoke"
        loading={revokeLoading}
      />

      {showKey && (
        <ShowKeyModal
          open={showKeyOpen}
          keyName={showKey.name}
          prefix={showKey.prefix}
          plainKey={showKey.key}
          onClose={() => {
            setShowKeyOpen(false);
            setShowKey(null);
          }}
        />
      )}
    </div>
  );
}

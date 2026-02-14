'use client';

import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { AVAILABLE_PERMISSIONS } from '../api/api-keys';
import { useState } from 'react';

export interface CreateApiKeyFormData {
  name: string;
  permissions: string[]; // Required
  expiresAt?: string;
}

interface CreateApiKeyModalProps {
  open: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (data: CreateApiKeyFormData) => Promise<void>;
}

export function CreateApiKeyModal({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: CreateApiKeyModalProps) {
  const [form, setForm] = useState<CreateApiKeyFormData>({ name: '', permissions: [] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.permissions.length === 0) return;
    try {
      await onSubmit(form);
      // Only clear form on success
      setForm({ name: '', permissions: [] });
    } catch {
      // Error handled by parent, keep form data
    }
  };

  const handleClose = () => {
    setForm({ name: '', permissions: [] });
    onClose();
  };

  const togglePermission = (perm: string) => {
    setForm((s) => ({
      ...s,
      permissions: s.permissions.includes(perm)
        ? s.permissions.filter((p) => p !== perm)
        : [...s.permissions, perm],
    }));
  };

  return (
    <Modal open={open} title="Create API Key" onClose={handleClose} contentClassName="max-h-none">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-2">Key Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
            placeholder="e.g., Production API, Mobile App"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Permissions * (at least 1 required)
          </label>
          <div className="space-y-2 border border-[rgb(var(--tc-border))] rounded-md p-3 max-h-40 overflow-y-auto">
            {AVAILABLE_PERMISSIONS.map((perm) => (
              <label key={perm.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(perm.value)}
                  onChange={() => togglePermission(perm.value)}
                  className="rounded border-[rgb(var(--tc-border))]"
                />
                <span className="text-sm">{perm.label}</span>
              </label>
            ))}
          </div>
          {form.permissions.length > 0 && (
            <div className="mt-2 text-xs text-[rgb(var(--tc-text-secondary))]">
              Selected: {form.permissions.length} permission(s)
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Expires At (Optional)</label>
          <input
            type="datetime-local"
            value={form.expiresAt || ''}
            onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value || undefined }))}
            className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !form.name.trim() || form.permissions.length === 0}
          >
            {loading ? 'Creating...' : 'Create Key'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

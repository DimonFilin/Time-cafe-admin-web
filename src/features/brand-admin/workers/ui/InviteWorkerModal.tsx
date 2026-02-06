'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';

interface InviteWorkerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InviteFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  cafes: Array<{ id: string; name: string }>;
}

export interface InviteFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  cafeId?: string;
}

const ROLES = [
  { value: 'CAFE_ADMIN', label: 'Cafe Admin' },
  { value: 'WORKER', label: 'Worker' },
];

export function InviteWorkerModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  cafes,
}: InviteWorkerModalProps) {
  const [form, setForm] = useState<InviteFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'WORKER',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(form);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'WORKER' });
    } catch {
      // Error handled by parent
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} title="Invite Worker" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
            disabled={loading}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {cafes.length > 0 && (
          <div>
            <label className="block text-sm font-medium">Cafe (optional)</label>
            <select
              value={form.cafeId || ''}
              onChange={(e) => setForm({ ...form, cafeId: e.target.value || undefined })}
              className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              disabled={loading}
            >
              <option value="">Select a cafe...</option>
              {cafes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[rgb(var(--tc-border))] pt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Inviting...' : 'Invite Worker'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import type { WorkerProfile } from '../api/workers';
import { t } from '@/i18n';

interface EditWorkerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: EditFormData) => Promise<void>;
  worker?: WorkerProfile | null;
  loading?: boolean;
  error?: string | null;
  cafes: Array<{ id: string; name: string }>;
}

export interface EditFormData {
  firstName?: string;
  lastName?: string;
  role?: string;
  cafeId?: string;
}

const ROLES = [
  { value: 'CAFE_ADMIN', label: 'Администратор кафе' },
  { value: 'WORKER', label: 'Работник' },
];

export function EditWorkerModal({
  open,
  onClose,
  onSubmit,
  worker,
  loading,
  error,
  cafes,
}: EditWorkerModalProps) {
  const [form, setForm] = useState<EditFormData>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    try {
      await onSubmit(worker.id, form);
    } catch {
      // Error handled by parent
    }
  };

  if (!open || !worker) return null;

  const currentForm = {
    firstName: form.firstName ?? worker.firstName,
    lastName: form.lastName ?? worker.lastName,
    role: form.role ?? worker.role,
    cafeId: form.cafeId ?? worker.cafeId,
  };

  return (
    <Modal
      open={open}
      title={`Редактировать работника: ${worker.firstName} ${worker.lastName}`}
      onClose={() => {
        setForm({});
        onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="text-sm text-[rgb(var(--tc-muted))]">
          <p>
            {t('common.email')}: {worker.email}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Имя</label>
            <input
              type="text"
              value={currentForm.firstName || ''}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Фамилия</label>
            <input
              type="text"
              value={currentForm.lastName || ''}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Роль</label>
          <select
            value={currentForm.role || ''}
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
            <label className="block text-sm font-medium">Кафе (необязательно)</label>
            <select
              value={currentForm.cafeId || ''}
              onChange={(e) => setForm({ ...form, cafeId: e.target.value || undefined })}
              className="mt-1 w-full rounded border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              disabled={loading}
            >
              <option value="">Выберите кафе...</option>
              {cafes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[rgb(var(--tc-border))] pt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setForm({});
              onClose();
            }}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

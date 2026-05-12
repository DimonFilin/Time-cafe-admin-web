'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { updateWorker } from '../api/workers-api';
import type { WorkerResponse, UpdateWorkerDto } from '../types/worker.types';
import { t } from '@/i18n';

interface EditWorkerModalProps {
  open: boolean;
  onClose: () => void;
  worker: WorkerResponse | null;
  onSuccess: () => void;
}

export function EditWorkerModal({ open, onClose, worker, onSuccess }: EditWorkerModalProps) {
  const [formData, setFormData] = useState<UpdateWorkerDto>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worker) {
      setFormData({
        email: worker.email,
        firstName: worker.firstName,
        lastName: worker.lastName,
        password: '',
      });
    }
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    setLoading(true);
    setError(null);

    try {
      // Only send fields that have changed
      const updates: UpdateWorkerDto = {};
      if (formData.email !== worker.email) updates.email = formData.email;
      if (formData.firstName !== worker.firstName) updates.firstName = formData.firstName;
      if (formData.lastName !== worker.lastName) updates.lastName = formData.lastName;
      if (formData.password) updates.password = formData.password;

      await updateWorker(worker.id, updates);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workers.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', firstName: '', lastName: '', password: '' });
    setError(null);
    onClose();
  };

  if (!worker) return null;

  return (
    <Modal open={open} onClose={handleClose} title={t('workers.edit')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('common.email')}</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('workers.firstName')}</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('workers.lastName')}</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('workers.newPassword')}</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={t('workers.newPasswordPlaceholder')}
            minLength={8}
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {t('workers.newPasswordPlaceholder')}
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="flex-1">
            {loading ? t('common.updating') : t('workers.updateWorker')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

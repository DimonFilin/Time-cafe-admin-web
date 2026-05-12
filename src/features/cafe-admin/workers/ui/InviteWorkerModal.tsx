'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { inviteWorker } from '../api/workers-api';
import type { InviteWorkerDto } from '../types/worker.types';
import { t } from '@/i18n';

interface InviteWorkerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteWorkerModal({ open, onClose, onSuccess }: InviteWorkerModalProps) {
  const [formData, setFormData] = useState<InviteWorkerDto>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await inviteWorker(formData);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workers.errors.inviteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', firstName: '', lastName: '', password: '' });
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={t('workers.invite')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('common.email')}</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="worker@example.com"
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
            placeholder="Иван"
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
            placeholder="Иванов"
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('workers.password')}</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder={t('workers.passwordMinLength')}
            minLength={8}
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {t('workers.passwordRequirement')}
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
            {loading ? t('workers.inviting') : t('workers.invite')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

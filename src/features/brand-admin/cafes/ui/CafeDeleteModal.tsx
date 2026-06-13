'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { t } from '@/i18n';

interface Cafe {
  id: string;
  name: string;
  city: string;
}

interface CafeDeleteModalProps {
  cafe: Cafe | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function CafeDeleteModal({ cafe, isOpen, onClose, onConfirm }: CafeDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cafe) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('brandAdmin.cafes.deleteFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-semibold">{t('brandAdmin.cafes.deleteTitle')}</h2>
        <p className="mt-2 text-sm text-[rgb(var(--tc-muted))]">
          {t('brandAdmin.cafes.deleteConfirmMessage')} <strong>{cafe.name}</strong>{' '}
          {t('brandAdmin.cafes.inCity')} {cafe.city}?
        </p>
        <p className="mt-2 text-sm text-red-600">{t('common.cannotUndo')}</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={onClose} variant="secondary" disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? t('common.deleting') : t('brandAdmin.cafes.deleteCafe')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

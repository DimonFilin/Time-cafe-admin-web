'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';
import { t } from '@/i18n';

interface Doc {
  id: string;
  name: string;
}

interface Props {
  doc: Doc;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DocumentDeleteModal({ doc, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/brand/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('brandAdmin.documents.deleteFailed'));
      }
      onDeleted(doc.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('brandAdmin.documents.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${t('brandAdmin.documents.deleteTitle')}: ${doc.name}`}
    >
      <div className="space-y-4">
        <p>{t('brandAdmin.documents.deleteConfirm')}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[rgb(var(--tc-border))] pt-4 mt-4">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDelete} className="bg-red-600 text-white" disabled={loading}>
            {loading ? t('common.deleting') : t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

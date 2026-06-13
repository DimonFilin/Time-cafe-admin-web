'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';
import { t } from '@/i18n';

const DOC_TYPES = [
  { value: 'REGISTRATION', labelKey: 'brandAdmin.documents.docTypes.registration' },
  { value: 'LICENSE', labelKey: 'brandAdmin.documents.docTypes.license' },
  { value: 'CONTRACT', labelKey: 'brandAdmin.documents.docTypes.contract' },
  { value: 'TAX_CERTIFICATE', labelKey: 'brandAdmin.documents.docTypes.taxCertificate' },
  { value: 'BANK_STATEMENT', labelKey: 'brandAdmin.documents.docTypes.bankStatement' },
  { value: 'OTHER', labelKey: 'brandAdmin.documents.docTypes.other' },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: (doc: { id: string; name: string; type: string }) => void;
}

export function DocumentUploadModal({ open, onClose, onUploaded }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState('REGISTRATION');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError(t('brandAdmin.documents.selectFile'));
    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('name', name);
      form.append('type', type);
      form.append('file', file);

      const res = await fetch('/api/brand/documents', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('brandAdmin.documents.uploadFailed'));
      }

      const created = await res.json();
      onUploaded(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('brandAdmin.documents.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('brandAdmin.documents.uploadDocument')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t('common.name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('brandAdmin.documents.namePlaceholder')}
            className="mt-1 block w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">{t('common.type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
          >
            {DOC_TYPES.map((docType) => (
              <option key={docType.value} value={docType.value}>
                {t(docType.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">{t('brandAdmin.documents.file')}</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full"
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 border-t border-[rgb(var(--tc-border))] pt-4 mt-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('common.uploading') : t('common.upload')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

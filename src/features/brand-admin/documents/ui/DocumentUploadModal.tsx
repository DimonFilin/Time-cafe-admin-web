'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';

const DOC_TYPES = [
  { value: 'REGISTRATION', label: 'Registration Document' },
  { value: 'LICENSE', label: 'License' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TAX_CERTIFICATE', label: 'Tax Certificate' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'OTHER', label: 'Other' },
];

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
    if (!file) return setError('Please select a file');
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
        throw new Error(err.message || 'Upload failed');
      }

      const created = await res.json();
      onUploaded(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Company Registration"
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full"
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

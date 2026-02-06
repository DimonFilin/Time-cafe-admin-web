'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';

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

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/brand/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Delete failed');
      }
      onDeleted(doc.id);
    } catch (err) {
      console.error('Delete error', err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Delete ${doc.name}`}>
      <div className="space-y-4">
        <p>Are you sure you want to delete this document? This action cannot be undone.</p>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDelete} className="bg-red-600 text-white">
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

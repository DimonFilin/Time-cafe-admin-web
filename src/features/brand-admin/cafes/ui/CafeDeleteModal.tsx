'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';

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
      setError(err instanceof Error ? err.message : 'Failed to delete cafe');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-semibold">Delete Cafe?</h2>
        <p className="mt-2 text-sm text-[rgb(var(--tc-muted))]">
          Are you sure you want to delete <strong>{cafe.name}</strong> in {cafe.city}?
        </p>
        <p className="mt-2 text-sm text-red-600">This action cannot be undone.</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={onClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete Cafe'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

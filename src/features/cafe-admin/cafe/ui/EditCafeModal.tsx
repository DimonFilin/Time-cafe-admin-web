'use client';

import { useState, useEffect } from 'react';
import { updateMyCafe } from '../api/cafe-api';
import { Cafe, UpdateCafeDto } from '../types/cafe.types';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';
import { cn } from '@/shared/lib/cn';

interface EditCafeModalProps {
  open: boolean;
  cafe: Cafe;
  onClose: () => void;
  onSuccess: () => void;
}

const labelClass = 'mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]';

const textareaClass = cn(
  'min-h-[96px] w-full resize-y rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 py-2 text-sm',
  'text-[rgb(var(--tc-fg))] placeholder:text-[rgb(var(--tc-muted))]',
  'transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tc-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--tc-bg))]',
);

export function EditCafeModal({ open, cafe, onClose, onSuccess }: EditCafeModalProps) {
  const [formData, setFormData] = useState<UpdateCafeDto>({
    name: cafe.name,
    description: cafe.description,
    address: cafe.address,
    city: cafe.city,
    street: cafe.street,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    cafeApiUrl: cafe.cafeApiUrl,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormData({
      name: cafe.name,
      description: cafe.description,
      address: cafe.address,
      city: cafe.city,
      street: cafe.street,
      latitude: cafe.latitude,
      longitude: cafe.longitude,
      cafeApiUrl: cafe.cafeApiUrl,
    });
    setError(null);
  }, [open, cafe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      await updateMyCafe(formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cafe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Edit cafe information"
      onClose={onClose}
      size="lg"
      bodyClassName="max-h-[min(70vh,560px)] overflow-y-auto pr-1"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="edit-cafe-form" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      }
    >
      <form id="edit-cafe-form" onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-fg))]">Basic information</h3>
          <div>
            <label htmlFor="cafe-name" className={labelClass}>
              Cafe name *
            </label>
            <Input
              id="cafe-name"
              value={formData.name ?? ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="cafe-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="cafe-description"
              className={textareaClass}
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value || undefined })
              }
              rows={4}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-fg))]">Address</h3>
          <div>
            <label htmlFor="cafe-address" className={labelClass}>
              Street address *
            </label>
            <Input
              id="cafe-address"
              value={formData.address ?? ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cafe-city" className={labelClass}>
                City *
              </label>
              <Input
                id="cafe-city"
                value={formData.city ?? ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="cafe-street" className={labelClass}>
                Street (optional)
              </label>
              <Input
                id="cafe-street"
                value={formData.street || ''}
                onChange={(e) => setFormData({ ...formData, street: e.target.value || undefined })}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-fg))]">Integration</h3>
          <div>
            <label htmlFor="cafe-api-url" className={labelClass}>
              Cafe API URL
            </label>
            <Input
              id="cafe-api-url"
              type="url"
              value={formData.cafeApiUrl || ''}
              onChange={(e) =>
                setFormData({ ...formData, cafeApiUrl: e.target.value || undefined })
              }
              placeholder="https://api.example.com"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-fg))]">Coordinates (optional)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cafe-lat" className={labelClass}>
                Latitude
              </label>
              <Input
                id="cafe-lat"
                type="number"
                step="0.000001"
                value={formData.latitude ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="e.g. 53.9023"
              />
            </div>
            <div>
              <label htmlFor="cafe-lng" className={labelClass}>
                Longitude
              </label>
              <Input
                id="cafe-lng"
                type="number"
                step="0.000001"
                value={formData.longitude ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="e.g. 27.5615"
              />
            </div>
          </div>
        </section>
      </form>
    </Modal>
  );
}

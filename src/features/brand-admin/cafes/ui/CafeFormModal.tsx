'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';

interface Cafe {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  street?: string;
  latitude: number;
  longitude: number;
  photos?: string[];
  regionId: string;
  cafeApiUrl?: string;
}

interface Region {
  id: string;
  name: string;
  country: string;
}

interface CafeFormModalProps {
  cafe?: Cafe | null;
  regions: Region[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Cafe>) => Promise<void>;
}

export function CafeFormModal({ cafe, regions, isOpen, onClose, onSave }: CafeFormModalProps) {
  const [formData, setFormData] = useState<Partial<Cafe>>(
    cafe || {
      name: '',
      description: '',
      address: '',
      city: '',
      street: '',
      latitude: 0,
      longitude: 0,
      regionId: regions[0]?.id || '',
    },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!formData.name?.trim()) {
        setError('Cafe name is required');
        setLoading(false);
        return;
      }

      if (!formData.city?.trim()) {
        setError('City is required');
        setLoading(false);
        return;
      }

      if (!formData.address?.trim()) {
        setError('Address is required');
        setLoading(false);
        return;
      }

      if (!formData.regionId) {
        setError('Region is required');
        setLoading(false);
        return;
      }

      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cafe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-semibold">{cafe ? 'Edit Cafe' : 'Create New Cafe'}</h2>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Cafe Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="e.g., Downtown Coffee Hub"
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Describe your cafe..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder="e.g., Seattle"
                className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium">Region *</label>
              <select
                name="regionId"
                value={formData.regionId || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              >
                <option value="">Select a region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}, {region.country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="e.g., 123 Main Street, Seattle, WA 98101"
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Street (optional) */}
          <div>
            <label className="block text-sm font-medium">Street (Optional)</label>
            <input
              type="text"
              name="street"
              value={formData.street || ''}
              onChange={handleChange}
              placeholder="Street name"
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Coordinates */}
          <div>
            <label className="block text-sm font-medium">Coordinates</label>
            <div className="mt-1 grid grid-cols-2 gap-4">
              <input
                type="number"
                name="latitude"
                value={formData.latitude || 0}
                onChange={handleChange}
                placeholder="Latitude"
                step="0.0001"
                className="rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
              <input
                type="number"
                name="longitude"
                value={formData.longitude || 0}
                onChange={handleChange}
                placeholder="Longitude"
                step="0.0001"
                className="rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
            </div>
          </div>

          {/* Cafe API URL */}
          <div>
            <label className="block text-sm font-medium">Cafe API URL (Optional)</label>
            <input
              type="url"
              name="cafeApiUrl"
              value={formData.cafeApiUrl || ''}
              onChange={handleChange}
              placeholder="https://api.cafe.local"
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? cafe
                  ? 'Updating...'
                  : 'Creating...'
                : cafe
                  ? 'Update Cafe'
                  : 'Create Cafe'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

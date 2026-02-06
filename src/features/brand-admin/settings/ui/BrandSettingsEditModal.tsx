'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import type { BrandSettings, UpdateBrandSettingsRequest } from '../api/settings';

interface BrandSettingsEditModalProps {
  brand: BrandSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateBrandSettingsRequest) => Promise<void>;
}

const COLOR_FIELDS = [
  { name: 'primaryColor', label: 'Primary Color' },
  { name: 'secondaryColor', label: 'Secondary Color' },
  { name: 'accentColor', label: 'Accent Color' },
  { name: 'backgroundColor', label: 'Background Color' },
  { name: 'textColor', label: 'Text Color' },
];

export function BrandSettingsEditModal({
  brand,
  isOpen,
  onClose,
  onSave,
}: BrandSettingsEditModalProps) {
  const [formData, setFormData] = useState<UpdateBrandSettingsRequest>({
    name: brand.name,
    email: brand.email,
    phone: brand.phone,
    address: brand.address,
    website: brand.website,
    description: brand.description,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    backgroundColor: brand.backgroundColor,
    textColor: brand.textColor,
    fontFamily: brand.fontFamily,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save settings';
      console.error('[BrandSettingsEditModal] Save error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <Card className="w-full max-w-2xl p-6 my-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Brand Settings</h2>
          <button
            onClick={onClose}
            className="text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Info Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Brand Information</h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                />
              </div>
            </div>
          </div>

          {/* Customization Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Brand Customization</h3>
            <div className="space-y-4">
              {/* Colors Grid */}
              <div className="grid grid-cols-2 gap-4">
                {COLOR_FIELDS.map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        name={name}
                        value={formData[name as keyof typeof formData] || '#000000'}
                        onChange={(e) => handleColorChange(name, e.target.value)}
                        className="h-10 w-16 rounded-lg border border-[rgb(var(--tc-border))] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData[name as keyof typeof formData] || '#000000'}
                        onChange={(e) => handleColorChange(name, e.target.value)}
                        className="flex-1 rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium mb-1">Font Family</label>
                <select
                  name="fontFamily"
                  value={formData.fontFamily || 'sans-serif'}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[rgb(var(--tc-border))]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--tc-fg))] hover:bg-[rgb(var(--tc-border))] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--tc-accent))] hover:opacity-90 disabled:opacity-50 rounded-lg transition-opacity"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

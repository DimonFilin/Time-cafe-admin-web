'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import type { UpdateBrandSettingsRequest } from '../../settings/api/settings';
import { t } from '@/i18n';

interface Brand {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  isVerified: boolean;
}

interface BrandEditModalProps {
  brand: Brand;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBrand: UpdateBrandSettingsRequest) => Promise<void>;
}

const COLOR_FIELDS: Array<{
  name: keyof Pick<
    UpdateBrandSettingsRequest,
    'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor' | 'textColor'
  >;
  labelKey: string;
}> = [
  { name: 'primaryColor', labelKey: 'brandAdmin.settings.primaryColor' },
  { name: 'secondaryColor', labelKey: 'brandAdmin.settings.secondaryColor' },
  { name: 'accentColor', labelKey: 'brandAdmin.settings.accentColor' },
  { name: 'backgroundColor', labelKey: 'brandAdmin.settings.backgroundColor' },
  { name: 'textColor', labelKey: 'brandAdmin.settings.textColor' },
];

export function BrandEditModal({ brand, isOpen, onClose, onSave }: BrandEditModalProps) {
  const [formData, setFormData] = useState<UpdateBrandSettingsRequest>({
    name: brand.name,
    email: brand.email,
    phone: brand.phone,
    website: brand.website,
    address: brand.address,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('brandAdmin.modals.saveBrandFailed');
      console.error('[BrandEditModal] Save error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl p-6">
        <h2 className="text-xl font-semibold">{t('brandAdmin.modals.editBrandProfile')}</h2>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">
              {t('brandAdmin.modals.brandName')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">{t('common.description')}</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">{t('common.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium">{t('common.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium">{t('common.website')}</label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium">{t('common.address')}</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">
              {t('brandAdmin.modals.brandColors')}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COLOR_FIELDS.map(({ name, labelKey }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-[rgb(var(--tc-muted))]">
                    {t(labelKey)}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      name={name}
                      value={formData[name] || '#000000'}
                      onChange={handleChange}
                      className="h-10 w-20 rounded-lg border border-[rgb(var(--tc-border))]"
                    />
                    <code className="text-xs text-[rgb(var(--tc-muted))]">
                      {formData[name] || '#000000'}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              {t('brandAdmin.settings.fontFamily')}
            </label>
            <select
              name="fontFamily"
              value={formData.fontFamily || 'sans-serif'}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            >
              <option value="sans-serif">Без засечек</option>
              <option value="serif">С засечками</option>
              <option value="monospace">Моноширинный</option>
              <option value="cursive">Курсив</option>
            </select>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

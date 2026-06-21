'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';
import type { BrandSettings, UpdateBrandSettingsRequest } from '../api/settings';
import { t } from '@/i18n';

interface BrandSettingsEditModalProps {
  brand: BrandSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateBrandSettingsRequest) => Promise<void>;
}

const COLOR_FIELDS = [
  { name: 'primaryColor', labelKey: 'brandAdmin.settings.primaryColor' },
  { name: 'secondaryColor', labelKey: 'brandAdmin.settings.secondaryColor' },
  { name: 'accentColor', labelKey: 'brandAdmin.settings.accentColor' },
  { name: 'backgroundColor', labelKey: 'brandAdmin.settings.backgroundColor' },
  { name: 'textColor', labelKey: 'brandAdmin.settings.textColor' },
];

function brandToForm(brand: BrandSettings): UpdateBrandSettingsRequest {
  return {
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
  };
}

export function BrandSettingsEditModal({
  brand,
  isOpen,
  onClose,
  onSave,
}: BrandSettingsEditModalProps) {
  const [formData, setFormData] = useState<UpdateBrandSettingsRequest>(() => brandToForm(brand));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(brandToForm(brand));
    setError(null);
  }, [isOpen, brand]);

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
      const errorMsg =
        err instanceof Error ? err.message : t('brandAdmin.modals.saveSettingsFailed');
      console.error('[BrandSettingsEditModal] Save error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title={t('brandAdmin.modals.brandSettings')}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="brand-settings-form" disabled={loading}>
            {loading ? t('common.saving') : t('brandAdmin.modals.saveSettings')}
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      ) : null}

      <form id="brand-settings-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="mb-4 text-sm font-semibold">{t('brandAdmin.modals.brandInformation')}</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('brandAdmin.modals.brandName')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('common.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('common.phone')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('common.website')}</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('common.description')}</label>
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

        <div>
          <h3 className="mb-4 text-sm font-semibold">
            {t('brandAdmin.modals.brandCustomization')}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {COLOR_FIELDS.map(({ name, labelKey }) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-medium">{t(labelKey)}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name={name}
                      value={formData[name as keyof typeof formData] || '#000000'}
                      onChange={(e) => handleColorChange(name, e.target.value)}
                      className="h-10 w-16 cursor-pointer rounded-lg border border-[rgb(var(--tc-border))]"
                    />
                    <input
                      type="text"
                      value={formData[name as keyof typeof formData] || '#000000'}
                      onChange={(e) => handleColorChange(name, e.target.value)}
                      className="flex-1 rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('brandAdmin.settings.fontFamily')}
              </label>
              <select
                name="fontFamily"
                value={formData.fontFamily || 'sans-serif'}
                onChange={handleChange}
                className="w-full rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              >
                <option value="sans-serif">Без засечек</option>
                <option value="serif">С засечками</option>
                <option value="monospace">Моноширинный</option>
                <option value="cursive">Курсив</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

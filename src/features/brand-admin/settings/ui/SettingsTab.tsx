'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import type { BrandSettings, UpdateBrandSettingsRequest } from '../api/settings';
import {
  getBrandSettings,
  updateBrandSettings,
  uploadBrandLogo,
  uploadBrandBanner,
  getLogoSignedUrl,
  getBannerSignedUrl,
} from '../api/settings';
import { BrandSettingsEditModal } from './BrandSettingsEditModal';
import { BrandLoyaltySettingsCard } from './BrandLoyaltySettingsCard';
import { t } from '@/i18n';

export function SettingsTab() {
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSignedUrl, setLogoSignedUrl] = useState<string | null>(null);

  // Banner upload state
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSignedUrl, setBannerSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandSettings();
  }, []);

  const loadSignedUrls = useCallback(
    async (
      brandId: string,
      logo: string | null | undefined,
      bannerImage: string | null | undefined,
    ) => {
      try {
        if (logo) {
          try {
            const logoRes = await getLogoSignedUrl(brandId);
            setLogoSignedUrl(logoRes.url);
          } catch (e) {
            console.warn('Failed to get signed logo URL:', e);
            setLogoSignedUrl(logo);
          }
        } else {
          setLogoSignedUrl(null);
        }

        if (bannerImage) {
          try {
            const bannerRes = await getBannerSignedUrl(brandId);
            setBannerSignedUrl(bannerRes.url);
          } catch (e) {
            console.warn('Failed to get signed banner URL:', e);
            setBannerSignedUrl(bannerImage || null);
          }
        } else {
          setBannerSignedUrl(null);
        }
      } catch (e) {
        console.error('Failed to load signed URLs:', e);
      }
    },
    [],
  );

  useEffect(() => {
    if (!brand?.id) return;
    void loadSignedUrls(brand.id, brand.logo, brand.bannerImage);
  }, [brand?.id, brand?.logo, brand?.bannerImage, loadSignedUrls]);

  const fetchBrandSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBrandSettings();
      setBrand(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('brandAdmin.modals.fetchSettingsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (data: UpdateBrandSettingsRequest) => {
    try {
      const updated = await updateBrandSettings(data);
      setBrand(updated);
    } catch (e) {
      throw e;
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setLogoUploading(true);
      setLogoError(null);
      await uploadBrandLogo(file);
      // Refresh brand data to get updated logo
      await fetchBrandSettings();
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : t('brandAdmin.modals.uploadLogoFailed'));
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    try {
      setBannerUploading(true);
      setBannerError(null);
      await uploadBrandBanner(file);
      // Refresh brand data to get updated banner
      await fetchBrandSettings();
    } catch (e) {
      setBannerError(e instanceof Error ? e.message : t('brandAdmin.modals.uploadBannerFailed'));
    } finally {
      setBannerUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('brandAdmin.settings.title')}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.settings.subtitle')}
          </p>
        </div>
        <Card className="p-6">
          <p className="text-center text-[rgb(var(--tc-muted))]">{t('common.loading')}</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('brandAdmin.settings.title')}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.settings.subtitle')}
          </p>
        </div>
        <Card className="p-6">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={fetchBrandSettings} className="mt-4 text-sm">
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!brand) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('brandAdmin.settings.title')}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.settings.subtitle')}
          </p>
        </div>
        <Button onClick={() => setEditOpen(true)} className="text-sm">
          {t('brandAdmin.settings.editSettings')}
        </Button>
      </div>

      {/* Brand Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{brand.name}</h3>
            <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {t('common.status')}:{' '}
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(brand.status)}`}
              >
                {brand.status}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[rgb(var(--tc-muted))]">
              {t('brandAdmin.settings.verified')}
            </p>
            <p className="mt-1 font-semibold">
              {brand.isVerified
                ? `✓ ${t('brandAdmin.settings.yes')}`
                : `✗ ${t('brandAdmin.settings.no')}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Brand Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('brandAdmin.settings.brandInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
              {t('common.name')}
            </p>
            <p className="mt-1 text-sm">{brand.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
              {t('common.email')}
            </p>
            <p className="mt-1 text-sm">{brand.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
              {t('common.phone')}
            </p>
            <p className="mt-1 text-sm">{brand.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
              {t('common.website')}
            </p>
            <p className="mt-1 text-sm">
              {brand.website ? (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[rgb(var(--tc-accent))] hover:underline"
                >
                  {brand.website}
                </a>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
              {t('common.address')}
            </p>
            <p className="mt-1 text-sm">{brand.address || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
              {t('common.description')}
            </p>
            <p className="mt-1 text-sm">{brand.description || '—'}</p>
          </div>
        </div>
      </Card>

      {/* Visual Assets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('brandAdmin.settings.visualAssets')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase mb-3">
              {t('brandAdmin.settings.logo')}
            </p>
            {logoSignedUrl && (
              <Image
                src={logoSignedUrl}
                alt={t('brandAdmin.modals.brandLogoAlt')}
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-lg border border-[rgb(var(--tc-border))] object-cover mb-3"
              />
            )}
            {!logoSignedUrl && (
              <div className="h-20 w-20 rounded-lg border border-[rgb(var(--tc-border))] flex items-center justify-center text-[rgb(var(--tc-muted))] mb-3">
                {t('brandAdmin.settings.noLogo')}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('brandAdmin.settings.uploadLogo')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                disabled={logoUploading}
                className="block w-full text-sm text-[rgb(var(--tc-muted))] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[rgb(var(--tc-accent))] file:text-white hover:file:opacity-90 file:cursor-pointer"
              />
              {logoError && <p className="mt-2 text-sm text-red-600">{logoError}</p>}
              {logoUploading && (
                <p className="mt-2 text-sm text-[rgb(var(--tc-muted))]">{t('common.uploading')}</p>
              )}
            </div>
          </div>

          {/* Banner */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase mb-3">
              {t('brandAdmin.settings.banner')}
            </p>
            {bannerSignedUrl && (
              <Image
                src={bannerSignedUrl}
                alt={t('brandAdmin.modals.brandBannerAlt')}
                width={800}
                height={80}
                unoptimized
                className="h-20 w-full rounded-lg border border-[rgb(var(--tc-border))] object-cover mb-3"
              />
            )}
            {!bannerSignedUrl && (
              <div className="h-20 w-full rounded-lg border border-[rgb(var(--tc-border))] flex items-center justify-center text-[rgb(var(--tc-muted))] mb-3">
                {t('brandAdmin.settings.noBanner')}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('brandAdmin.settings.uploadBanner')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBannerUpload(file);
                }}
                disabled={bannerUploading}
                className="block w-full text-sm text-[rgb(var(--tc-muted))] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[rgb(var(--tc-accent))] file:text-white hover:file:opacity-90 file:cursor-pointer"
              />
              {bannerError && <p className="mt-2 text-sm text-red-600">{bannerError}</p>}
              {bannerUploading && (
                <p className="mt-2 text-sm text-[rgb(var(--tc-muted))]">{t('common.uploading')}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Brand Colors */}
      {(brand.primaryColor || brand.secondaryColor || brand.accentColor) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('brandAdmin.settings.brandColors')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {brand.primaryColor && (
              <div>
                <div
                  className="h-16 rounded-lg border border-[rgb(var(--tc-border))] mb-2"
                  style={{ backgroundColor: brand.primaryColor }}
                />
                <p className="text-xs font-semibold text-[rgb(var(--tc-muted))]">
                  {t('brandAdmin.settings.primaryColor')}
                </p>
                <p className="text-sm font-mono">{brand.primaryColor}</p>
              </div>
            )}
            {brand.secondaryColor && (
              <div>
                <div
                  className="h-16 rounded-lg border border-[rgb(var(--tc-border))] mb-2"
                  style={{ backgroundColor: brand.secondaryColor }}
                />
                <p className="text-xs font-semibold text-[rgb(var(--tc-muted))]">
                  {t('brandAdmin.settings.secondaryColor')}
                </p>
                <p className="text-sm font-mono">{brand.secondaryColor}</p>
              </div>
            )}
            {brand.accentColor && (
              <div>
                <div
                  className="h-16 rounded-lg border border-[rgb(var(--tc-border))] mb-2"
                  style={{ backgroundColor: brand.accentColor }}
                />
                <p className="text-xs font-semibold text-[rgb(var(--tc-muted))]">
                  {t('brandAdmin.settings.accentColor')}
                </p>
                <p className="text-sm font-mono">{brand.accentColor}</p>
              </div>
            )}
            {brand.backgroundColor && (
              <div>
                <div
                  className="h-16 rounded-lg border border-[rgb(var(--tc-border))] mb-2"
                  style={{ backgroundColor: brand.backgroundColor }}
                />
                <p className="text-xs font-semibold text-[rgb(var(--tc-muted))]">
                  {t('brandAdmin.settings.backgroundColor')}
                </p>
                <p className="text-sm font-mono">{brand.backgroundColor}</p>
              </div>
            )}
            {brand.textColor && (
              <div>
                <div
                  className="h-16 rounded-lg border border-[rgb(var(--tc-border))] mb-2"
                  style={{ backgroundColor: brand.textColor }}
                />
                <p className="text-xs font-semibold text-[rgb(var(--tc-muted))]">
                  {t('brandAdmin.settings.textColor')}
                </p>
                <p className="text-sm font-mono">{brand.textColor}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Font Settings */}
      {brand.fontFamily && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('brandAdmin.settings.fontSettings')}</h3>
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
              {t('brandAdmin.settings.fontFamily')}
            </p>
            <p className="mt-2 text-sm capitalize">{brand.fontFamily}</p>
          </div>
        </Card>
      )}

      <BrandLoyaltySettingsCard />

      {/* Metadata */}
      <Card className="p-6 bg-[rgb(var(--tc-bg-alt))]">
        <p className="text-xs font-semibold text-[rgb(var(--tc-muted))] uppercase">
          {t('brandAdmin.settings.lastUpdated')}
        </p>
        <p className="mt-1 text-sm">
          {new Date(brand.updatedAt).toLocaleDateString()}{' '}
          {new Date(brand.updatedAt).toLocaleTimeString()}
        </p>
      </Card>

      {/* Edit Modal */}
      <BrandSettingsEditModal
        brand={brand}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

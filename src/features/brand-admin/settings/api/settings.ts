'use client';

export interface BrandSettings {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  logo?: string;
  banner?: string;
  bannerImage?: string; // Backend returns 'bannerImage' on banner upload
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandSettingsRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export async function getBrandSettings(): Promise<BrandSettings> {
  const res = await fetch('/api/brand', {
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function updateBrandSettings(
  request: UpdateBrandSettingsRequest,
): Promise<BrandSettings> {
  const res = await fetch('/api/brand', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function uploadBrandLogo(file: File): Promise<{ logo: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/brand/logo', {
    method: 'POST',
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string' ? data.message : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function uploadBrandBanner(file: File): Promise<{ banner: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/brand/banner', {
    method: 'POST',
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string' ? data.message : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function getLogoSignedUrl(brandId: string): Promise<{ url: string }> {
  const res = await fetch(`/api/brand/${brandId}/logo-url`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string' ? data.message : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function getBannerSignedUrl(brandId: string): Promise<{ url: string }> {
  const res = await fetch(`/api/brand/${brandId}/banner-url`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage =
      typeof data.message === 'string' ? data.message : `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

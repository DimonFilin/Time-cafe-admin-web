import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { fetchBrandWorkerOrAuthError } from '@/shared/lib/brand-worker-auth';
import { t } from '@/i18n';

export async function GET() {
  try {
    const auth = await fetchBrandWorkerOrAuthError();
    if (!auth.ok) return auth.response;

    const worker = auth.worker;
    if (!worker.brandId) {
      return NextResponse.json({ message: t('apiErrors.noBrandForWorker') }, { status: 400 });
    }

    const url = `${env.backendUrl}/brands/${worker.brandId}`;
    return fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[api/brand] GET Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await fetchBrandWorkerOrAuthError();
    if (!auth.ok) return auth.response;

    const worker = auth.worker;
    if (!worker.brandId) {
      return NextResponse.json({ message: t('apiErrors.noBrandForWorker') }, { status: 400 });
    }

    const {
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      fontFamily,
      ...brandData
    } = body;

    let updatedBrand: Record<string, unknown> | null = null;

    if (Object.keys(brandData).length > 0) {
      const updateUrl = `${env.backendUrl}/brands/${worker.brandId}`;
      const brandResponse = await fetchWithAuthRefresh(updateUrl, {
        method: 'PATCH',
        body: JSON.stringify(brandData),
        cache: 'no-store',
      });

      if (!brandResponse.ok) {
        return brandResponse;
      }

      const brandText = await brandResponse.text().catch(() => '');
      updatedBrand = brandText ? JSON.parse(brandText) : null;
    }

    const customizationData: Record<string, string> = {};
    if (primaryColor) customizationData.primaryColor = primaryColor;
    if (secondaryColor) customizationData.secondaryColor = secondaryColor;
    if (accentColor) customizationData.accentColor = accentColor;
    if (backgroundColor) customizationData.backgroundColor = backgroundColor;
    if (textColor) customizationData.textColor = textColor;
    if (fontFamily) customizationData.fontFamily = fontFamily;

    if (Object.keys(customizationData).length > 0) {
      const customizationUrl = `${env.backendUrl}/brands/${worker.brandId}/customization`;
      const customResponse = await fetchWithAuthRefresh(customizationUrl, {
        method: 'PATCH',
        body: JSON.stringify(customizationData),
        cache: 'no-store',
      });

      if (!customResponse.ok) {
        return customResponse;
      }

      const customText = await customResponse.text().catch(() => '');
      updatedBrand = customText ? JSON.parse(customText) : null;
    }

    if (updatedBrand) {
      return NextResponse.json(updatedBrand);
    }

    return NextResponse.json({ message: 'No data to update' }, { status: 400 });
  } catch (error) {
    console.error('[api/brand] PATCH Error:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

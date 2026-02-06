import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

interface WorkerResponse {
  brandId: string;
  [key: string]: unknown;
}

async function getWorkerWithAuthRefresh(): Promise<WorkerResponse> {
  const workerUrl = `${env.backendUrl}/auth/workers/me`;

  const response = await fetchWithAuthRefresh(workerUrl, { method: 'GET', cache: 'no-store' });

  if (!response || typeof response.status !== 'number') {
    throw new Error('Invalid response fetching worker');
  }

  if (response.status >= 400) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch worker: ${response.status} ${text}`);
  }

  const text = await response.text().catch(() => '');
  const worker = text ? JSON.parse(text) : { brandId: '' };

  return worker;
}

export async function GET() {
  try {
    // Get current worker to get brandId with auth refresh
    const worker = await getWorkerWithAuthRefresh();

    if (!worker.brandId) {
      return NextResponse.json(
        { message: 'No brand associated with this worker' },
        { status: 400 },
      );
    }

    // Then fetch brand details
    const url = `${env.backendUrl}/brands/${worker.brandId}`;

    const brandResponse = await fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });

    return brandResponse;
  } catch (error) {
    console.error('[api/brand] GET Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    // Get current worker with auth refresh
    const worker = await getWorkerWithAuthRefresh();
    if (!worker.brandId) {
      return NextResponse.json(
        { message: 'No brand associated with this worker' },
        { status: 400 },
      );
    }

    // Separate brand data from customization data
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

    // Update brand info if there's data for it
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

    // Update customization if there's color data
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

    // If we updated something, return the updated brand
    if (updatedBrand) {
      return NextResponse.json(updatedBrand);
    } else {
      // If nothing was sent, return error
      return NextResponse.json({ message: 'No data to update' }, { status: 400 });
    }
  } catch (error) {
    console.error('[api/brand] PATCH Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

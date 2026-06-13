import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function POST(request: NextRequest, context: { params: Promise<{ bucket: string }> }) {
  try {
    const { bucket } = await context.params;

    // Get form data from request
    const formData = await request.formData();

    // Forward to backend
    return fetchWithAuthRefresh(`${env.backendUrl}/admin/storage/upload/${bucket}`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Storage upload proxy error:', error);
    return NextResponse.json({ error: t('apiErrors.uploadFile') }, { status: 500 });
  }
}

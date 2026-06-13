import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = `${env.backendUrl}/cafe-admin/workers/${id}`;

    return fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Cafe admin worker GET error:', error);
    return NextResponse.json({ error: t('apiErrors.fetchWorker') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const url = `${env.backendUrl}/cafe-admin/workers/${id}`;

    return fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cafe admin worker PATCH error:', error);
    return NextResponse.json({ error: t('apiErrors.updateWorker') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = `${env.backendUrl}/cafe-admin/workers/${id}`;

    return fetchWithAuthRefresh(url, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Cafe admin worker DELETE error:', error);
    return NextResponse.json({ error: t('apiErrors.deleteWorker') }, { status: 500 });
  }
}

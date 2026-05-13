import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = `${env.backendUrl}/cafe-admin/workers/${id}/shift-schedule`;
    return fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[workers shift-schedule GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load shift schedule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.text();
    const url = `${env.backendUrl}/cafe-admin/workers/${id}/shift-schedule`;
    return fetchWithAuthRefresh(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[workers shift-schedule PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to save shift schedule' }, { status: 500 });
  }
}

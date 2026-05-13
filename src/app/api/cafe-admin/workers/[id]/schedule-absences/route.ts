import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = `${env.backendUrl}/cafe-admin/workers/${id}/schedule-absences`;
    return fetchWithAuthRefresh(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    console.error('[schedule-absences GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load absences' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.text();
    const url = `${env.backendUrl}/cafe-admin/workers/${id}/schedule-absences`;
    return fetchWithAuthRefresh(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[schedule-absences POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create absence' }, { status: 500 });
  }
}

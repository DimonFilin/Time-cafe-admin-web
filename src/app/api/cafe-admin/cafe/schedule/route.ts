import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { t } from '@/i18n';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${BACKEND_URL}/cafe-admin/cafe/my/schedule`;

    return fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating cafe schedule:', error);
    return NextResponse.json({ message: t('apiErrors.updateCafeSchedule') }, { status: 500 });
  }
}

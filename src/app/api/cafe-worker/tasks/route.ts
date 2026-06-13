import { NextRequest, NextResponse } from 'next/server';
import { t } from '@/i18n';

import { env } from '@/shared/config/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const url = date
      ? `${env.backendUrl}/cafe-worker/tasks?date=${date}`
      : `${env.backendUrl}/cafe-worker/tasks`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: t('apiErrors.fetchTasks') }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching worker tasks:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

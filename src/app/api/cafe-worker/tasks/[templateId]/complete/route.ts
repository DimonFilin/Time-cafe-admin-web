import { NextRequest, NextResponse } from 'next/server';
import { t } from '@/i18n';

import { env } from '@/shared/config/env';

type RouteParams = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function POST(request: NextRequest, props: RouteParams) {
  try {
    const params = await props.params;
    const { templateId } = params;
    const body = await request.json();

    const response = await fetch(`${env.backendUrl}/cafe-worker/tasks/${templateId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: t('apiErrors.completeTask') }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: RouteParams) {
  try {
    const params = await props.params;
    const { templateId } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 });
    }

    const response = await fetch(
      `${env.backendUrl}/cafe-worker/tasks/${templateId}/complete?date=${date}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: t('apiErrors.uncompleteTask') }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uncompleting task:', error);
    return NextResponse.json({ message: t('apiErrors.internalServer') }, { status: 500 });
  }
}

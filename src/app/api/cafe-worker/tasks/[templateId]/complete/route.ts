import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

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

    const response = await fetch(`${BACKEND_URL}/cafe-worker/tasks/${templateId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to complete task' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
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
      `${BACKEND_URL}/cafe-worker/tasks/${templateId}/complete?date=${date}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to uncomplete task' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uncompleting task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

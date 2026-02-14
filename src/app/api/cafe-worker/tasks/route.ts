import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const url = date
      ? `${BACKEND_URL}/cafe-worker/tasks?date=${date}`
      : `${BACKEND_URL}/cafe-worker/tasks`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch tasks' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching worker tasks:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

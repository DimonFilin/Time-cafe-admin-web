import { NextResponse } from 'next/server';

/**
 * Handle backend errors and transform them to user-friendly responses
 * - 5xx errors → 503 Service Unavailable
 * - Network errors → 503 with connection error message
 * - 4xx errors → proxy as is (for validation/auth logic)
 */
export function handleBackendError(error: unknown, url: string, response?: Response): NextResponse {
  // Network errors (fetch failed, connection refused, timeout, etc.)
  if (error instanceof TypeError) {
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('refused') ||
      errorMessage.includes('timeout')
    ) {
      console.error('[handle-backend-error] Network error:', error.message);
      console.error('[handle-backend-error] URL:', url);
      return NextResponse.json(
        {
          message: 'Не удалось подключиться к серверу. Проверьте подключение к интернету.',
          error: 'Service Unavailable',
          statusCode: 503,
        },
        { status: 503 },
      );
    }
  }

  // If we have a response, check its status
  if (response) {
    const status = response.status;

    // 5xx errors → transform to 503
    if (status >= 500 && status < 600) {
      console.error('[handle-backend-error] Backend 5xx error:', status);
      console.error('[handle-backend-error] URL:', url);

      // Try to get error message from response
      const errorMessage = 'Сервис временно недоступен. Попробуйте позже.';
      try {
        // Don't await here, just log what we can
        response
          .clone()
          .text()
          .then((text) => {
            console.error('[handle-backend-error] Backend error response:', text);
          })
          .catch(() => {
            // Ignore errors when reading response
          });
      } catch {
        // Ignore
      }

      return NextResponse.json(
        {
          message: errorMessage,
          error: 'Service Unavailable',
          statusCode: 503,
        },
        { status: 503 },
      );
    }

    // 4xx errors → proxy as is (for validation/auth logic)
    if (status >= 400 && status < 500) {
      // Log but don't transform
      console.log('[handle-backend-error] Backend 4xx error:', status, 'URL:', url);
      // Return null to indicate we should proxy the response
      return null as unknown as NextResponse;
    }
  }

  // Unknown error
  console.error('[handle-backend-error] Unknown error:', error);
  console.error('[handle-backend-error] URL:', url);
  return NextResponse.json(
    {
      message: 'Произошла неизвестная ошибка. Попробуйте позже.',
      error: 'Internal Server Error',
      statusCode: 500,
    },
    { status: 500 },
  );
}

/**
 * Process backend response and handle errors
 * Returns transformed response or null if should proxy as is
 */
export async function processBackendResponse(
  response: Response,
  url: string,
): Promise<NextResponse | null> {
  const status = response.status;

  // 5xx errors → transform to 503
  if (status >= 500 && status < 600) {
    console.error('[process-backend-response] Backend 5xx error:', status);
    console.error('[process-backend-response] URL:', url);

    let errorText = '';
    try {
      errorText = await response.text();
      console.error('[process-backend-response] Backend error response:', errorText);
    } catch {
      // Ignore errors when reading response
    }

    return NextResponse.json(
      {
        message: 'Сервис временно недоступен. Попробуйте позже.',
        error: 'Service Unavailable',
        statusCode: 503,
      },
      { status: 503 },
    );
  }

  // 4xx errors → proxy as is (for validation/auth logic)
  if (status >= 400 && status < 500) {
    console.log('[process-backend-response] Backend 4xx error:', status, 'URL:', url);
    // Return null to indicate we should proxy the response
    return null;
  }

  // 2xx, 3xx → proxy as is
  return null;
}

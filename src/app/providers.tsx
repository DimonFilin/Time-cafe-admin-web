'use client';

import { ThemeProvider } from 'next-themes';
import { Suspense, type ReactNode } from 'react';
import { WorkerActivityRouteBeacon } from '@/shared/lib/worker-activity-route-beacon';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Suspense fallback={null}>
        <WorkerActivityRouteBeacon />
      </Suspense>
      {children}
    </ThemeProvider>
  );
}

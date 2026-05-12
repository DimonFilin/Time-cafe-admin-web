'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  ActivityAction,
  ActivityCategory,
} from '@/features/brand-admin/activity-logs/api/activity-logs-api';
import { logWorkerActivity } from './log-worker-activity';

const TRACKED_PREFIXES = ['/brand-admin', '/cafe-admin', '/worker', '/system-admin'];

function isTrackedPath(pathname: string): boolean {
  return TRACKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function WorkerActivityRouteBeacon() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !isTrackedPath(pathname)) return;
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    logWorkerActivity({
      action: ActivityAction.PAGE_VIEW,
      category: ActivityCategory.VIEW,
      resourceType: 'NAV_PAGE',
      details: { path: pathname },
    });
  }, [pathname]);

  return null;
}

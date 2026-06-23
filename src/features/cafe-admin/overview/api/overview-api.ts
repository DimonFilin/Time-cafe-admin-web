export interface CafeOverviewStats {
  date: string;
  activeWorkers: number;
  totalWorkers: number;
  tasksToday: number;
  completedTasks: number;
  ordersToday: number;
  revenueToday: number;
}

export async function getCafeOverviewStats(date?: string): Promise<CafeOverviewStats> {
  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await fetch(`/api/cafe-admin/overview/stats${params}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string; error?: string }).message ||
        (error as { error?: string }).error ||
        'Failed to fetch overview stats',
    );
  }

  return response.json();
}

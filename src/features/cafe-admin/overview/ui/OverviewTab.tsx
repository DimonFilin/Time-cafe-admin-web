'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';
import { getMyCafe } from '../../cafe/api/cafe-api';
import type { Cafe } from '../../cafe/types/cafe.types';

function switchTab(tab: string, extra?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('cafeAdminSwitchTab', { detail: { tab, ...extra } }));
}

interface OverviewStats {
  activeWorkers: number;
  totalWorkers: number;
  tasksToday: number;
  completedTasks: number;
}

export function OverviewTab() {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cafeData = await getMyCafe();
        setCafe(cafeData);

        // TODO: Fetch real stats from API
        setStats({
          activeWorkers: 0,
          totalWorkers: 0,
          tasksToday: 0,
          completedTasks: 0,
        });
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-[rgb(var(--tc-muted))]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cafe Header */}
      {cafe && (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{cafe.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-[rgb(var(--tc-muted))]">
                <span>
                  📍 {cafe.address}, {cafe.city}
                </span>
                <span>⭐ {cafe.rating.toFixed(1)}</span>
                <span>🧾 {cafe.reviewsCount} reviews</span>
                {cafe.regionName ? <span>🗺️ {cafe.regionName}</span> : null}
                {cafe.cafeApiUrl ? <span>🔗 API connected</span> : null}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
        <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Quick overview of your cafe</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">Active Workers</div>
          <div className="mt-2 text-2xl font-bold">{stats?.activeWorkers || 0}</div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            of {stats?.totalWorkers || 0} total
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">Tasks Today</div>
          <div className="mt-2 text-2xl font-bold">{stats?.tasksToday || 0}</div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            {stats?.completedTasks || 0} completed
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">Orders Today</div>
          <div className="mt-2 text-2xl font-bold">0</div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">Coming soon</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-[rgb(var(--tc-muted))]">Revenue Today</div>
          <div className="mt-2 text-2xl font-bold">
            <MoneyAmount value={0} iconClassName="h-[1.15em] w-[0.95em]" />
          </div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">Coming soon</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => switchTab('workers', { openInvite: true })}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">Invite Worker</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Add a new team member</div>
          </button>
          <button
            onClick={() => switchTab('tasks', { openCreate: true })}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">Create Task</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Add a new task template</div>
          </button>
          <button
            onClick={() => switchTab('activity-logs')}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">View Activity Logs</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Check recent activities</div>
          </button>
          <button
            onClick={() => switchTab('workers')}
            className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]"
          >
            <div className="font-medium">Manage Workers</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">View and edit team</div>
          </button>
        </div>
      </Card>
    </div>
  );
}

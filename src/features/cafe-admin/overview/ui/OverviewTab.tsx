'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { getMyCafe } from '../../cafe/api/cafe-api';
import type { Cafe } from '../../cafe/types/cafe.types';

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
                <span>📞 {cafe.phone}</span>
                <span>✉️ {cafe.email}</span>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    cafe.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {cafe.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
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
          <div className="mt-2 text-2xl font-bold">$0</div>
          <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">Coming soon</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]">
            <div className="font-medium">Invite Worker</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Add a new team member</div>
          </button>
          <button className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]">
            <div className="font-medium">Create Task</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Add a new task template</div>
          </button>
          <button className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]">
            <div className="font-medium">View Activity Logs</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Check recent activities</div>
          </button>
          <button className="rounded-lg border border-[rgb(var(--tc-border))] p-4 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))]">
            <div className="font-medium">Manage Workers</div>
            <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">View and edit team</div>
          </button>
        </div>
      </Card>
    </div>
  );
}

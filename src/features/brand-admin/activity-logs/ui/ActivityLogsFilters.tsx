'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import {
  ActivityAction,
  ActivityCategory,
  type ActivityLogsFilters,
} from '../api/activity-logs-api';
import { WorkerSelectModal } from './WorkerSelectModal';
import type { WorkerProfile } from '../../workers/api/workers';

interface ActivityLogsFiltersProps {
  filters: ActivityLogsFilters;
  onFiltersChange: (filters: ActivityLogsFilters) => void;
  onReset: () => void;
}

export function ActivityLogsFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
}: ActivityLogsFiltersProps) {
  const [workerSelectOpen, setWorkerSelectOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);

  const updateFilter = (key: keyof ActivityLogsFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleWorkerSelect = (worker: WorkerProfile) => {
    setSelectedWorker(worker);
    updateFilter('workerId', worker.id);
  };

  const handleClearWorker = () => {
    setSelectedWorker(null);
    updateFilter('workerId', undefined);
  };

  const hasActiveFilters = Boolean(
    filters.action || filters.category || filters.startDate || filters.endDate || filters.workerId,
  );

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Worker Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              Worker
            </label>
            {selectedWorker ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 py-2 text-sm">
                  <div className="font-medium">
                    {selectedWorker.firstName} {selectedWorker.lastName}
                  </div>
                  <div className="text-xs text-[rgb(var(--tc-muted))]">{selectedWorker.email}</div>
                </div>
                <Button variant="ghost" onClick={handleClearWorker} className="text-sm">
                  Clear
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setWorkerSelectOpen(true)}
                className="w-full"
              >
                Select Worker
              </Button>
            )}
          </div>

          {/* Action Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              Action
            </label>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.action || ''}
              onChange={(e) => updateFilter('action', e.target.value as ActivityAction)}
            >
              <option value="">All Actions</option>
              <optgroup label="Auth">
                <option value={ActivityAction.LOGIN}>Login</option>
                <option value={ActivityAction.LOGOUT}>Logout</option>
                <option value={ActivityAction.PASSWORD_CHANGE}>Password Change</option>
              </optgroup>
              <optgroup label="Data">
                <option value={ActivityAction.CREATE}>Create</option>
                <option value={ActivityAction.UPDATE}>Update</option>
                <option value={ActivityAction.DELETE}>Delete</option>
                <option value={ActivityAction.BULK_UPDATE}>Bulk Update</option>
                <option value={ActivityAction.BULK_DELETE}>Bulk Delete</option>
              </optgroup>
              <optgroup label="Views">
                <option value={ActivityAction.VIEW_LIST}>View List</option>
                <option value={ActivityAction.VIEW_DETAIL}>View Detail</option>
                <option value={ActivityAction.VIEW_REPORT}>View Report</option>
                <option value={ActivityAction.EXPORT_DATA}>Export Data</option>
              </optgroup>
              <optgroup label="Navigation">
                <option value={ActivityAction.PAGE_VIEW}>Page View</option>
                <option value={ActivityAction.MODAL_OPEN}>Modal Open</option>
                <option value={ActivityAction.MODAL_CLOSE}>Modal Close</option>
                <option value={ActivityAction.TAB_SWITCH}>Tab Switch</option>
              </optgroup>
              <optgroup label="Config">
                <option value={ActivityAction.UPDATE_SETTINGS}>Update Settings</option>
                <option value={ActivityAction.UPDATE_PERMISSIONS}>Update Permissions</option>
              </optgroup>
              <optgroup label="Special">
                <option value={ActivityAction.FILE_UPLOAD}>File Upload</option>
                <option value={ActivityAction.FILE_DELETE}>File Delete</option>
                <option value={ActivityAction.PAYMENT_PROCESS}>Payment Process</option>
              </optgroup>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              Category
            </label>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value as ActivityCategory)}
            >
              <option value="">All Categories</option>
              <option value={ActivityCategory.AUTH}>Auth</option>
              <option value={ActivityCategory.DATA}>Data</option>
              <option value={ActivityCategory.VIEW}>View</option>
              <option value={ActivityCategory.CONFIG}>Config</option>
              <option value={ActivityCategory.FINANCIAL}>Financial</option>
              <option value={ActivityCategory.SECURITY}>Security</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.startDate || ''}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              End Date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.endDate || ''}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div>
              <Button
                variant="ghost"
                onClick={() => {
                  onReset();
                  setSelectedWorker(null);
                }}
                className="text-sm"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedWorker && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[rgb(var(--tc-surface-2))] px-2 py-1 text-xs">
                Worker: {selectedWorker.firstName} {selectedWorker.lastName}
                <button
                  onClick={handleClearWorker}
                  className="ml-1 hover:text-[rgb(var(--tc-danger))]"
                >
                  ×
                </button>
              </span>
            )}
            {filters.action && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[rgb(var(--tc-surface-2))] px-2 py-1 text-xs">
                Action: {filters.action}
                <button
                  onClick={() => updateFilter('action', undefined)}
                  className="ml-1 hover:text-[rgb(var(--tc-danger))]"
                >
                  ×
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[rgb(var(--tc-surface-2))] px-2 py-1 text-xs">
                Category: {filters.category}
                <button
                  onClick={() => updateFilter('category', undefined)}
                  className="ml-1 hover:text-[rgb(var(--tc-danger))]"
                >
                  ×
                </button>
              </span>
            )}
            {filters.startDate && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[rgb(var(--tc-surface-2))] px-2 py-1 text-xs">
                From: {filters.startDate}
                <button
                  onClick={() => updateFilter('startDate', undefined)}
                  className="ml-1 hover:text-[rgb(var(--tc-danger))]"
                >
                  ×
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[rgb(var(--tc-surface-2))] px-2 py-1 text-xs">
                To: {filters.endDate}
                <button
                  onClick={() => updateFilter('endDate', undefined)}
                  className="ml-1 hover:text-[rgb(var(--tc-danger))]"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </Card>

      <WorkerSelectModal
        open={workerSelectOpen}
        onClose={() => setWorkerSelectOpen(false)}
        onSelect={handleWorkerSelect}
        selectedWorkerId={filters.workerId}
      />
    </>
  );
}

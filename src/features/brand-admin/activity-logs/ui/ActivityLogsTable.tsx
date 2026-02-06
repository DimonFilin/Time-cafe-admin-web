'use client';

import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { Button } from '@/shared/ui/button/Button';
import type { ActivityLog } from '../api/activity-logs-api';

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetails?: (log: ActivityLog) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function ActivityLogsTable({
  logs,
  isLoading,
  error,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  sortBy,
  sortOrder,
  onSort,
}: ActivityLogsTableProps) {
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <span className="ml-1 text-[rgb(var(--tc-muted))]">↕</span>;
    }
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const columns: DataTableColumn<ActivityLog>[] = [
    {
      key: 'createdAt',
      header: 'Time',
      render: (log) => (
        <div className="text-sm">
          <div className="font-medium">{new Date(log.createdAt).toLocaleDateString()}</div>
          <div className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(log.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'worker',
      header: 'Worker',
      render: (log) => (
        <div className="text-sm">
          <div className="font-medium">
            {log.worker?.firstName} {log.worker?.lastName}
          </div>
          <div className="text-xs text-[rgb(var(--tc-muted))]">
            {log.worker?.email || log.workerEmail}
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${getActionBadgeColor(log.action)}`}
          >
            {log.action}
          </span>
          {log.severity === 'CRITICAL' && (
            <span className="inline-flex items-center rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
              !
            </span>
          )}
          {log.severity === 'WARNING' && (
            <span className="inline-flex items-center rounded-lg bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
              ⚠
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (log) => <span className="text-sm text-[rgb(var(--tc-muted))]">{log.category}</span>,
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (log) => {
        if (!log.resourceType) {
          return <span className="text-sm text-[rgb(var(--tc-muted))]">—</span>;
        }
        return (
          <div className="text-sm">
            <div className="font-medium">{log.resourceType}</div>
            {log.resourceId && (
              <div className="text-xs text-[rgb(var(--tc-muted))] truncate max-w-[150px]">
                {log.resourceId}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'details',
      header: 'Details',
      render: (log) => (
        <div className="flex items-center gap-2">
          {log.cafe && <span className="text-xs text-[rgb(var(--tc-muted))]">{log.cafe.name}</span>}
          {onViewDetails && (
            <Button variant="ghost" onClick={() => onViewDetails(log)} className="text-xs">
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Add sorting to headers if onSort is provided
  if (onSort) {
    columns[0].header = (
      <button
        onClick={() => onSort('createdAt')}
        className="flex items-center hover:text-[rgb(var(--tc-accent))]"
      >
        Time
        {renderSortIcon('createdAt')}
      </button>
    ) as unknown as string;

    columns[1].header = (
      <button
        onClick={() => onSort('workerEmail')}
        className="flex items-center hover:text-[rgb(var(--tc-accent))]"
      >
        Worker
        {renderSortIcon('workerEmail')}
      </button>
    ) as unknown as string;

    columns[2].header = (
      <button
        onClick={() => onSort('action')}
        className="flex items-center hover:text-[rgb(var(--tc-accent))]"
      >
        Action
        {renderSortIcon('action')}
      </button>
    ) as unknown as string;

    columns[3].header = (
      <button
        onClick={() => onSort('category')}
        className="flex items-center hover:text-[rgb(var(--tc-accent))]"
      >
        Category
        {renderSortIcon('category')}
      </button>
    ) as unknown as string;
  }

  return (
    <DataTable<ActivityLog>
      rows={logs}
      columns={columns}
      getRowId={(log) => log.id}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      isLoading={isLoading}
      error={error}
    />
  );
}

function getActionBadgeColor(action: string): string {
  switch (action) {
    case 'LOGIN':
    case 'LOGOUT':
      return 'bg-blue-100 text-blue-800';
    case 'CREATE':
      return 'bg-green-100 text-green-800';
    case 'UPDATE':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELETE':
    case 'BULK_DELETE':
      return 'bg-red-100 text-red-800';
    case 'PAGE_VIEW':
    case 'MODAL_OPEN':
    case 'TAB_SWITCH':
      return 'bg-purple-100 text-purple-800';
    case 'PAYMENT_PROCESS':
      return 'bg-orange-100 text-orange-800';
    case 'UPDATE_SETTINGS':
    case 'UPDATE_PERMISSIONS':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

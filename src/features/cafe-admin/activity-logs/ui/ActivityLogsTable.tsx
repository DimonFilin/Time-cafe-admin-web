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
      render: (log) => {
        const event = getEventPresentation(log);
        const showBaseAction = event.baseAction !== event.label;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${event.colorClassName}`}
              title={event.title}
            >
              {event.icon ? `${event.icon} ` : ''}
              {event.label}
            </span>
            {showBaseAction && (
              <span
                className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${getActionBadgeColor(event.baseAction)}`}
                title="Base action"
              >
                {event.baseAction}
              </span>
            )}
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
        );
      },
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
              <div className="max-w-[150px] truncate text-xs text-[rgb(var(--tc-muted))]">
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
      render: (log) => {
        const summary = getLogSummary(log);
        return (
          <div className="flex items-center gap-3">
            {onViewDetails && (
              <Button variant="ghost" onClick={() => onViewDetails(log)} className="text-xs">
                View
              </Button>
            )}
            {summary && (
              <div className="min-w-0">
                <div className="max-w-[360px] truncate text-xs text-[rgb(var(--tc-muted))]">
                  {summary}
                </div>
              </div>
            )}
          </div>
        );
      },
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function getString(details: Record<string, unknown> | null, key: string): string | null {
  if (!details) return null;
  const v = details[key];
  return typeof v === 'string' ? v : null;
}

function getEventPresentation(log: ActivityLog): {
  label: string;
  baseAction: string;
  colorClassName: string;
  icon?: string;
  title?: string;
} {
  const baseAction = String(log.action);
  const details = asRecord(log.details);
  const detailsAction = getString(details, 'action');

  // Shift status updates are stored in details.action (START_SHIFT / END_SHIFT)
  if (log.resourceType === 'WORKER' && baseAction === 'UPDATE' && detailsAction) {
    if (detailsAction === 'START_SHIFT') {
      return {
        label: 'START_SHIFT',
        baseAction,
        colorClassName: 'bg-green-100 text-green-800',
        icon: '🟢',
        title: getString(details, 'message') ?? undefined,
      };
    }
    if (detailsAction === 'END_SHIFT') {
      return {
        label: 'END_SHIFT',
        baseAction,
        colorClassName: 'bg-red-100 text-red-800',
        icon: '⚪',
        title: getString(details, 'message') ?? undefined,
      };
    }
  }

  // Task completion (worker checked/un-checked task)
  if (log.resourceType === 'TASK_COMPLETION') {
    if (baseAction === 'CREATE') {
      return {
        label: 'TASK_COMPLETED',
        baseAction,
        colorClassName: 'bg-green-100 text-green-800',
        icon: '✅',
      };
    }
    if (baseAction === 'DELETE') {
      return {
        label: 'TASK_UNCOMPLETED',
        baseAction,
        colorClassName: 'bg-gray-100 text-gray-800',
        icon: '↩',
      };
    }
  }

  // Order status transitions (no explicit details in backend logs; infer from endpoint)
  if (log.resourceType === 'ORDER' && baseAction === 'UPDATE' && log.endpoint) {
    if (log.endpoint.includes('/orders/') && log.endpoint.includes('/confirm')) {
      return {
        label: 'ORDER_CONFIRM',
        baseAction,
        colorClassName: 'bg-blue-100 text-blue-800',
        icon: '🧾',
      };
    }
    if (log.endpoint.includes('/orders/') && log.endpoint.includes('/complete')) {
      return {
        label: 'ORDER_COMPLETE',
        baseAction,
        colorClassName: 'bg-green-100 text-green-800',
        icon: '✅',
      };
    }
    if (log.endpoint.includes('/orders/') && log.endpoint.includes('/cancel')) {
      return {
        label: 'ORDER_CANCEL',
        baseAction,
        colorClassName: 'bg-red-100 text-red-800',
        icon: '✖',
      };
    }
  }

  return {
    label: baseAction,
    baseAction,
    colorClassName: getActionBadgeColor(baseAction),
  };
}

function extractOrderIdFromEndpoint(endpoint?: string): string | null {
  if (!endpoint) return null;
  const m = endpoint.match(/\/orders\/([^/?]+)\//);
  return m?.[1] ?? null;
}

function getLogSummary(log: ActivityLog): string | null {
  const details = asRecord(log.details);

  // Shift status summary
  const detailsAction = getString(details, 'action');
  if (
    log.resourceType === 'WORKER' &&
    String(log.action) === 'UPDATE' &&
    (detailsAction === 'START_SHIFT' || detailsAction === 'END_SHIFT')
  ) {
    const message = getString(details, 'message');
    const prev = getString(details, 'previousStatus');
    const next = getString(details, 'shiftStatus');
    if (message && prev && next) return `${message} (${prev} → ${next})`;
    if (message) return message;
    if (prev && next) return `Shift status: ${prev} → ${next}`;
    return null;
  }

  // Task completion summary
  if (log.resourceType === 'TASK_COMPLETION') {
    const taskTitle = getString(details, 'taskTitle');
    const completionDate = getString(details, 'completionDate');
    if (taskTitle && completionDate) return `${taskTitle} • ${completionDate}`;
    if (taskTitle) return taskTitle;
    return null;
  }

  // Order update summary (infer order id)
  if (log.resourceType === 'ORDER' && String(log.action) === 'UPDATE') {
    const id = log.resourceId || extractOrderIdFromEndpoint(log.endpoint);
    if (id) return `Order: ${id}`;
    return log.endpoint ? `Order update: ${log.endpoint}` : null;
  }

  // Generic details summary: show message if present
  const message = getString(details, 'message');
  if (message) return message;

  return null;
}

'use client';

import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import type { ActivityLog } from '../api/activity-logs-api';

interface ActivityLogDetailsModalProps {
  open: boolean;
  onClose: () => void;
  log: ActivityLog | null;
}

export function ActivityLogDetailsModal({ open, onClose, log }: ActivityLogDetailsModalProps) {
  if (!open || !log) return null;

  return (
    <Modal open={open} title="Activity Log Details" onClose={onClose}>
      <div className="space-y-6">
        {/* Timestamp */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Timestamp</h3>
          <p className="mt-1 text-sm">
            {new Date(log.createdAt).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'long',
            })}
          </p>
        </div>

        {/* Worker */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Worker</h3>
          <div className="mt-1 text-sm">
            <div className="font-medium">
              {log.worker?.firstName} {log.worker?.lastName}
            </div>
            <div className="text-[rgb(var(--tc-muted))]">
              {log.worker?.email || log.workerEmail}
            </div>
            <div className="text-[rgb(var(--tc-muted))]">Role: {log.workerRole}</div>
          </div>
        </div>

        {/* Context */}
        {(log.brand || log.cafe) && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Context</h3>
            <div className="mt-1 space-y-1 text-sm">
              {log.brand && <div>Brand: {log.brand.name}</div>}
              {log.cafe && <div>Cafe: {log.cafe.name}</div>}
            </div>
          </div>
        )}

        {/* Action */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Action</h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${getActionBadgeColor(log.action)}`}
            >
              {log.action}
            </span>
            <span className="text-sm text-[rgb(var(--tc-muted))]">{log.category}</span>
            <span
              className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${getSeverityBadgeColor(log.severity)}`}
            >
              {log.severity}
            </span>
          </div>
        </div>

        {/* Resource */}
        {log.resourceType && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Resource</h3>
            <div className="mt-1 text-sm">
              <div>Type: {log.resourceType}</div>
              {log.resourceId && (
                <div className="text-[rgb(var(--tc-muted))]">ID: {log.resourceId}</div>
              )}
            </div>
          </div>
        )}

        {/* Details */}
        {log.details && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Details</h3>
            <pre className="mt-1 overflow-auto rounded-xl bg-[rgb(var(--tc-surface-2))] p-3 text-xs">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}

        {/* Metadata */}
        {log.metadata && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Metadata</h3>
            <pre className="mt-1 overflow-auto rounded-xl bg-[rgb(var(--tc-surface-2))] p-3 text-xs">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Technical Info */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">Technical Info</h3>
          <div className="mt-1 space-y-1 text-sm">
            {log.ipAddress && (
              <div className="flex justify-between">
                <span className="text-[rgb(var(--tc-muted))]">IP Address:</span>
                <span className="font-mono">{log.ipAddress}</span>
              </div>
            )}
            {log.userAgent && (
              <div className="flex justify-between">
                <span className="text-[rgb(var(--tc-muted))]">User Agent:</span>
                <span className="truncate max-w-[300px] font-mono text-xs" title={log.userAgent}>
                  {log.userAgent}
                </span>
              </div>
            )}
            {log.endpoint && (
              <div className="flex justify-between">
                <span className="text-[rgb(var(--tc-muted))]">Endpoint:</span>
                <span className="font-mono">{log.endpoint}</span>
              </div>
            )}
            {log.method && (
              <div className="flex justify-between">
                <span className="text-[rgb(var(--tc-muted))]">Method:</span>
                <span className="font-mono">{log.method}</span>
              </div>
            )}
            {log.statusCode !== undefined && (
              <div className="flex justify-between">
                <span className="text-[rgb(var(--tc-muted))]">Status Code:</span>
                <span
                  className={`font-mono ${log.statusCode >= 400 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {log.statusCode}
                </span>
              </div>
            )}
            {log.duration !== undefined && (
              <div className="flex justify-between">
                <span className="text-[rgb(var(--tc-muted))]">Duration:</span>
                <span className="font-mono">{log.duration}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end border-t border-[rgb(var(--tc-border))] pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
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

function getSeverityBadgeColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800';
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-800';
    case 'INFO':
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

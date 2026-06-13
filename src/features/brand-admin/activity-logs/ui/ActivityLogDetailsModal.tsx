'use client';

import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { getActivityLogTechnicalDisplay } from '@/shared/lib/activity-log-technical-display';
import { t } from '@/i18n';
import type { ActivityLog } from '../api/activity-logs-api';

interface ActivityLogDetailsModalProps {
  open: boolean;
  onClose: () => void;
  log: ActivityLog | null;
}

export function ActivityLogDetailsModal({ open, onClose, log }: ActivityLogDetailsModalProps) {
  if (!open || !log) return null;

  const event = getEventPresentation(log);
  const technical = getActivityLogTechnicalDisplay(log);

  return (
    <Modal open={open} title={t('cafeAdmin.activityLogs.detailsModal.title')} onClose={onClose}>
      <div className="space-y-6">
        {/* Timestamp */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.detailsModal.timestamp')}
          </h3>
          <p className="mt-1 text-sm">
            {new Date(log.createdAt).toLocaleString('ru-RU', {
              dateStyle: 'full',
              timeStyle: 'long',
            })}
          </p>
        </div>

        {/* Worker */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.worker')}
          </h3>
          <div className="mt-1 text-sm">
            <div className="font-medium">
              {log.worker?.firstName} {log.worker?.lastName}
            </div>
            <div className="text-[rgb(var(--tc-muted))]">
              {log.worker?.email || log.workerEmail}
            </div>
            <div className="text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.detailsModal.role')}: {log.workerRole}
            </div>
          </div>
        </div>

        {/* Context */}
        {(log.brand || log.cafe) && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.detailsModal.context')}
            </h3>
            <div className="mt-1 space-y-1 text-sm">
              {log.brand && (
                <div>
                  {t('cafeAdmin.activityLogs.detailsModal.brand')}: {log.brand.name}
                </div>
              )}
              {log.cafe && (
                <div>
                  {t('cafeAdmin.activityLogs.detailsModal.cafe')}: {log.cafe.name}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.action')}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${event.colorClassName}`}
              title={event.title}
            >
              {event.icon ? `${event.icon} ` : ''}
              {event.label}
            </span>
            {event.baseAction !== event.label && (
              <span
                className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${getActionBadgeColor(event.baseAction)}`}
                title={t('cafeAdmin.activityLogs.baseAction')}
              >
                {event.baseAction}
              </span>
            )}
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
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.resource')}
            </h3>
            <div className="mt-1 text-sm">
              <div>
                {t('cafeAdmin.activityLogs.detailsModal.resourceType')}: {log.resourceType}
              </div>
              {log.resourceId && (
                <div className="text-[rgb(var(--tc-muted))]">
                  {t('cafeAdmin.activityLogs.detailsModal.resourceId')}: {log.resourceId}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details */}
        {log.details && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.details')}
            </h3>
            <pre className="mt-1 overflow-auto rounded-xl bg-[rgb(var(--tc-surface-2))] p-3 text-xs">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}

        {/* Metadata */}
        {log.metadata && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.detailsModal.metadata')}
            </h3>
            <pre className="mt-1 overflow-auto rounded-xl bg-[rgb(var(--tc-surface-2))] p-3 text-xs">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Технические полезные только для реальных HTTP-вызовов; beacon из админки — без шума */}
        {technical && (
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.detailsModal.technicalInfo')}
            </h3>
            <div className="mt-1 space-y-1 text-sm">
              {technical.ipAddress && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('cafeAdmin.activityLogs.detailsModal.ipAddress')}:
                  </span>
                  <span className="font-mono">{technical.ipAddress}</span>
                </div>
              )}
              {technical.userAgent && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('cafeAdmin.activityLogs.detailsModal.userAgent')}:
                  </span>
                  <span
                    className="max-w-[300px] truncate font-mono text-xs"
                    title={technical.userAgent}
                  >
                    {technical.userAgent}
                  </span>
                </div>
              )}
              {technical.endpoint && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('cafeAdmin.activityLogs.detailsModal.endpoint')}:
                  </span>
                  <span className="font-mono">{technical.endpoint}</span>
                </div>
              )}
              {technical.method && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('cafeAdmin.activityLogs.detailsModal.method')}:
                  </span>
                  <span className="font-mono">{technical.method}</span>
                </div>
              )}
              {technical.statusCode !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('cafeAdmin.activityLogs.detailsModal.statusCode')}:
                  </span>
                  <span
                    className={`font-mono ${technical.statusCode >= 400 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {technical.statusCode}
                  </span>
                </div>
              )}
              {technical.duration !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('cafeAdmin.activityLogs.detailsModal.duration')}:
                  </span>
                  <span className="font-mono">{technical.duration}ms</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end border-t border-[rgb(var(--tc-border))] pt-4">
          <Button onClick={onClose}>{t('common.close')}</Button>
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

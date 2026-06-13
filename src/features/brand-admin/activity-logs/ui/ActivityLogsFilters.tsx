'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { t } from '@/i18n';
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
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.worker')}
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
                  {t('cafeAdmin.activityLogs.clear')}
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setWorkerSelectOpen(true)}
                className="w-full"
              >
                {t('cafeAdmin.activityLogs.selectWorker')}
              </Button>
            )}
          </div>

          <div className="min-w-[150px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.action')}
            </label>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.action || ''}
              onChange={(e) => updateFilter('action', e.target.value as ActivityAction)}
            >
              <option value="">{t('cafeAdmin.activityLogs.allActions')}</option>
              <optgroup label={t('cafeAdmin.activityLogs.groups.auth')}>
                <option value={ActivityAction.LOGIN}>
                  {t('cafeAdmin.activityLogs.actions.login')}
                </option>
                <option value={ActivityAction.LOGOUT}>
                  {t('cafeAdmin.activityLogs.actions.logout')}
                </option>
                <option value={ActivityAction.PASSWORD_CHANGE}>
                  {t('cafeAdmin.activityLogs.actions.passwordChange')}
                </option>
              </optgroup>
              <optgroup label={t('cafeAdmin.activityLogs.groups.data')}>
                <option value={ActivityAction.CREATE}>
                  {t('cafeAdmin.activityLogs.actions.create')}
                </option>
                <option value={ActivityAction.UPDATE}>
                  {t('cafeAdmin.activityLogs.actions.update')}
                </option>
                <option value={ActivityAction.DELETE}>
                  {t('cafeAdmin.activityLogs.actions.delete')}
                </option>
                <option value={ActivityAction.BULK_UPDATE}>
                  {t('cafeAdmin.activityLogs.actions.bulkUpdate')}
                </option>
                <option value={ActivityAction.BULK_DELETE}>
                  {t('cafeAdmin.activityLogs.actions.bulkDelete')}
                </option>
              </optgroup>
              <optgroup label={t('cafeAdmin.activityLogs.groups.views')}>
                <option value={ActivityAction.VIEW_LIST}>
                  {t('cafeAdmin.activityLogs.actions.viewList')}
                </option>
                <option value={ActivityAction.VIEW_DETAIL}>
                  {t('cafeAdmin.activityLogs.actions.viewDetail')}
                </option>
                <option value={ActivityAction.VIEW_REPORT}>
                  {t('cafeAdmin.activityLogs.actions.viewReport')}
                </option>
                <option value={ActivityAction.EXPORT_DATA}>
                  {t('cafeAdmin.activityLogs.actions.exportData')}
                </option>
              </optgroup>
              <optgroup label={t('cafeAdmin.activityLogs.groups.navigation')}>
                <option value={ActivityAction.PAGE_VIEW}>
                  {t('cafeAdmin.activityLogs.actions.pageView')}
                </option>
                <option value={ActivityAction.MODAL_OPEN}>
                  {t('cafeAdmin.activityLogs.actions.modalOpen')}
                </option>
                <option value={ActivityAction.MODAL_CLOSE}>
                  {t('cafeAdmin.activityLogs.actions.modalClose')}
                </option>
                <option value={ActivityAction.TAB_SWITCH}>
                  {t('cafeAdmin.activityLogs.actions.tabSwitch')}
                </option>
              </optgroup>
              <optgroup label={t('cafeAdmin.activityLogs.groups.config')}>
                <option value={ActivityAction.UPDATE_SETTINGS}>
                  {t('cafeAdmin.activityLogs.actions.updateSettings')}
                </option>
                <option value={ActivityAction.UPDATE_PERMISSIONS}>
                  {t('cafeAdmin.activityLogs.actions.updatePermissions')}
                </option>
              </optgroup>
              <optgroup label={t('cafeAdmin.activityLogs.groups.special')}>
                <option value={ActivityAction.FILE_UPLOAD}>
                  {t('cafeAdmin.activityLogs.actions.fileUpload')}
                </option>
                <option value={ActivityAction.FILE_DELETE}>
                  {t('cafeAdmin.activityLogs.actions.fileDelete')}
                </option>
                <option value={ActivityAction.PAYMENT_PROCESS}>
                  {t('cafeAdmin.activityLogs.actions.paymentProcess')}
                </option>
              </optgroup>
            </select>
          </div>

          <div className="min-w-[150px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.category')}
            </label>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value as ActivityCategory)}
            >
              <option value="">{t('cafeAdmin.activityLogs.allCategories')}</option>
              <option value={ActivityCategory.AUTH}>
                {t('cafeAdmin.activityLogs.categories.auth')}
              </option>
              <option value={ActivityCategory.DATA}>
                {t('cafeAdmin.activityLogs.categories.data')}
              </option>
              <option value={ActivityCategory.VIEW}>
                {t('cafeAdmin.activityLogs.categories.view')}
              </option>
              <option value={ActivityCategory.CONFIG}>
                {t('cafeAdmin.activityLogs.categories.config')}
              </option>
              <option value={ActivityCategory.FINANCIAL}>
                {t('cafeAdmin.activityLogs.categories.financial')}
              </option>
              <option value={ActivityCategory.SECURITY}>
                {t('cafeAdmin.activityLogs.categories.security')}
              </option>
            </select>
          </div>

          <div className="min-w-[150px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.startDate')}
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.startDate || ''}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>

          <div className="min-w-[150px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]">
              {t('cafeAdmin.activityLogs.endDate')}
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.endDate || ''}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>

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
                {t('cafeAdmin.activityLogs.resetFilters')}
              </Button>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedWorker && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[rgb(var(--tc-surface-2))] px-2 py-1 text-xs">
                {t('cafeAdmin.activityLogs.worker')}: {selectedWorker.firstName}{' '}
                {selectedWorker.lastName}
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
                {t('cafeAdmin.activityLogs.action')}: {filters.action}
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
                {t('cafeAdmin.activityLogs.category')}: {filters.category}
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
                {t('cafeAdmin.activityLogs.from')}: {filters.startDate}
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
                {t('cafeAdmin.activityLogs.to')}: {filters.endDate}
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

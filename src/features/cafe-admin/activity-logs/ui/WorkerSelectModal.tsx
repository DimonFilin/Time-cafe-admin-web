'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { t } from '@/i18n';
import { getWorkers } from '../../workers/api/workers-api';
import type { WorkerResponse } from '../../workers/types/worker.types';

interface WorkerSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (worker: WorkerResponse) => void;
  selectedWorkerId?: string;
}

export function WorkerSelectModal({
  open,
  onClose,
  onSelect,
  selectedWorkerId,
}: WorkerSelectModalProps) {
  const [workers, setWorkers] = useState<WorkerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchWorkers();
    }
  }, [open]);

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkers({ limit: 100 });
      setWorkers(data.workers);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('workers.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.firstName.toLowerCase().includes(search.toLowerCase()) ||
      w.lastName.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (worker: WorkerResponse) => {
    onSelect(worker);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('cafeAdmin.activityLogs.workerSelectModal.title')}
    >
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder={t('cafeAdmin.activityLogs.workerSelectModal.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
        />

        {/* Workers List */}
        {loading ? (
          <div className="py-8 text-center text-sm text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.workerSelectModal.loadingWorkers')}
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="py-8 text-center text-sm text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.workerSelectModal.noWorkersFound')}
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {filteredWorkers.map((worker) => (
              <button
                key={worker.id}
                onClick={() => handleSelect(worker)}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-[rgb(var(--tc-surface-1))] ${
                  selectedWorkerId === worker.id
                    ? 'border-[rgb(var(--tc-accent))] bg-[rgb(var(--tc-surface-1))]'
                    : 'border-[rgb(var(--tc-border))]'
                }`}
              >
                <div className="font-medium">
                  {worker.firstName} {worker.lastName}
                </div>
                <div className="text-xs text-[rgb(var(--tc-muted))]">{worker.email}</div>
                <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
                  {worker.shiftStatus === 'ON_SHIFT' ? (
                    <span className="text-green-600">
                      {t('cafeAdmin.activityLogs.workerSelectModal.onShift')}
                    </span>
                  ) : (
                    <span>{t('cafeAdmin.activityLogs.workerSelectModal.offShift')}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end border-t border-[rgb(var(--tc-border))] pt-4">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

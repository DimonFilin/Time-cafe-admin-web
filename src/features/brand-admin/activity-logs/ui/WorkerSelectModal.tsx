'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { t } from '@/i18n';
import { listWorkers, type WorkerProfile } from '../../workers/api/workers';

interface WorkerSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (worker: WorkerProfile) => void;
  selectedWorkerId?: string;
}

export function WorkerSelectModal({
  open,
  onClose,
  onSelect,
  selectedWorkerId,
}: WorkerSelectModalProps) {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      void fetchWorkers();
    }
  }, [open]);

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWorkers({ page: 1, limit: 100 });
      setWorkers(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('workers.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const query = searchQuery.toLowerCase();
    return (
      worker.firstName.toLowerCase().includes(query) ||
      worker.lastName.toLowerCase().includes(query) ||
      worker.email.toLowerCase().includes(query)
    );
  });

  const handleSelect = (worker: WorkerProfile) => {
    onSelect(worker);
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      title={t('cafeAdmin.activityLogs.workerSelectModal.title')}
      onClose={onClose}
    >
      <div className="space-y-4">
        <input
          type="search"
          placeholder={t('cafeAdmin.activityLogs.workerSelectModal.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
          autoFocus
        />

        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading && (
          <div className="py-8 text-center text-sm text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.workerSelectModal.loadingWorkers')}
          </div>
        )}

        {!loading && filteredWorkers.length === 0 && (
          <div className="py-8 text-center text-sm text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.activityLogs.workerSelectModal.noWorkersFound')}
          </div>
        )}

        {!loading && filteredWorkers.length > 0 && (
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {filteredWorkers.map((worker) => (
              <button
                key={worker.id}
                type="button"
                onClick={() => handleSelect(worker)}
                className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-[rgb(var(--tc-surface-2))] ${
                  selectedWorkerId === worker.id
                    ? 'border-[rgb(var(--tc-accent))] bg-[rgb(var(--tc-surface-2))]'
                    : 'border-[rgb(var(--tc-border))]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {worker.firstName} {worker.lastName}
                    </div>
                    <div className="text-xs text-[rgb(var(--tc-muted))]">{worker.email}</div>
                  </div>
                  <div className="text-xs text-[rgb(var(--tc-muted))]">{worker.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[rgb(var(--tc-border))] pt-4">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

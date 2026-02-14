'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { createTaskTemplate } from '../api/tasks-api';
import {
  TaskCategory,
  TaskPriority,
  TaskAssignmentType,
  type CreateTaskTemplateDto,
} from '../types/tasks.types';
import type { WorkerRole } from '@/shared/types/worker-role';
import { getWorkers } from '../../workers/api/workers-api';
import type { WorkerResponse } from '../../workers/types/worker.types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTaskModal({ open, onClose, onSuccess }: CreateTaskModalProps) {
  const [formData, setFormData] = useState<CreateTaskTemplateDto>({
    title: '',
    description: '',
    category: TaskCategory.GENERAL,
    priority: TaskPriority.MEDIUM,
    estimatedMinutes: undefined,
    requiresPhoto: false,
    requiresComment: false,
    assignmentType: TaskAssignmentType.ALL_WORKERS,
    assignedWorkerIds: [],
    assignedRoles: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workers, setWorkers] = useState<WorkerResponse[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workersError, setWorkersError] = useState<string | null>(null);

  const roleOptions = useMemo(
    () =>
      [
        { value: 'CAFE_ADMIN', label: 'Cafe Admin' },
        { value: 'WORKER', label: 'Worker' },
      ] as const satisfies ReadonlyArray<{ value: WorkerRole; label: string }>,
    [],
  );

  useEffect(() => {
    if (!open) return;
    if (formData.assignmentType !== TaskAssignmentType.SPECIFIC_WORKERS) return;

    let cancelled = false;
    setWorkersLoading(true);
    setWorkersError(null);
    getWorkers({ page: 1, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setWorkers(res.workers ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setWorkers([]);
        setWorkersError(e instanceof Error ? e.message : 'Failed to fetch workers');
      })
      .finally(() => {
        if (cancelled) return;
        setWorkersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, formData.assignmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.assignmentType === TaskAssignmentType.SPECIFIC_WORKERS &&
      (!formData.assignedWorkerIds || formData.assignedWorkerIds.length === 0)
    ) {
      setError('Выберите хотя бы одного сотрудника (Specific Workers).');
      return;
    }
    if (
      formData.assignmentType === TaskAssignmentType.ROLE_BASED &&
      (!formData.assignedRoles || formData.assignedRoles.length === 0)
    ) {
      setError('Выберите хотя бы одну роль (Role Based).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createTaskTemplate(formData);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: TaskCategory.GENERAL,
      priority: TaskPriority.MEDIUM,
      estimatedMinutes: undefined,
      requiresPhoto: false,
      requiresComment: false,
      assignmentType: TaskAssignmentType.ALL_WORKERS,
      assignedWorkerIds: [],
      assignedRoles: [],
    });
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Task Template">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as TaskCategory,
                })
              }
              className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
            >
              {Object.values(TaskCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as TaskPriority,
                })
              }
              className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
            >
              {Object.values(TaskPriority).map((pri) => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Estimated Minutes (optional)</label>
          <input
            type="number"
            value={formData.estimatedMinutes || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedMinutes: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            min="1"
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Assignment Type</label>
          <select
            value={formData.assignmentType}
            onChange={(e) =>
              setFormData((s) => {
                const nextType = e.target.value as TaskAssignmentType;
                return {
                  ...s,
                  assignmentType: nextType,
                  assignedWorkerIds:
                    nextType === TaskAssignmentType.SPECIFIC_WORKERS
                      ? (s.assignedWorkerIds ?? [])
                      : [],
                  assignedRoles:
                    nextType === TaskAssignmentType.ROLE_BASED ? (s.assignedRoles ?? []) : [],
                };
              })
            }
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
          >
            <option value={TaskAssignmentType.ALL_WORKERS}>All Workers</option>
            <option value={TaskAssignmentType.SPECIFIC_WORKERS}>Specific Workers</option>
            <option value={TaskAssignmentType.ROLE_BASED}>Role Based</option>
          </select>
        </div>

        {formData.assignmentType === TaskAssignmentType.SPECIFIC_WORKERS && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Specific workers</div>
            {workersError && (
              <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{workersError}</div>
            )}
            {workersLoading ? (
              <div className="text-sm text-[rgb(var(--tc-muted))]">Loading workers…</div>
            ) : workers.length === 0 ? (
              <div className="text-sm text-[rgb(var(--tc-muted))]">No workers found</div>
            ) : (
              <div className="max-h-48 space-y-2 overflow-auto rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-3">
                {workers.map((w) => {
                  const checked = (formData.assignedWorkerIds ?? []).includes(w.id);
                  return (
                    <label key={w.id} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const nextChecked = e.target.checked;
                          setFormData((s) => {
                            const prev = s.assignedWorkerIds ?? [];
                            const next = nextChecked
                              ? Array.from(new Set([...prev, w.id]))
                              : prev.filter((id) => id !== w.id);
                            return { ...s, assignedWorkerIds: next };
                          });
                        }}
                      />
                      <span className="text-sm">
                        {w.firstName} {w.lastName}{' '}
                        <span className="text-xs text-[rgb(var(--tc-muted))]">({w.email})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {formData.assignmentType === TaskAssignmentType.ROLE_BASED && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Roles</div>
            <div className="space-y-2 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-3">
              {roleOptions.map((r) => {
                const checked = (formData.assignedRoles ?? []).includes(r.value);
                return (
                  <label key={r.value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const nextChecked = e.target.checked;
                        setFormData((s) => {
                          const prev = s.assignedRoles ?? [];
                          const next = nextChecked
                            ? Array.from(new Set([...prev, r.value]))
                            : prev.filter((x) => x !== r.value);
                          return { ...s, assignedRoles: next };
                        });
                      }}
                    />
                    <span className="text-sm">{r.label}</span>
                    <span className="text-xs text-[rgb(var(--tc-muted))] font-mono">{r.value}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requiresPhoto}
              onChange={(e) => setFormData({ ...formData, requiresPhoto: e.target.checked })}
            />
            <span className="text-sm">Requires Photo</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requiresComment}
              onChange={(e) => setFormData({ ...formData, requiresComment: e.target.checked })}
            />
            <span className="text-sm">Requires Comment</span>
          </label>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { t } from '@/i18n';
import { getTaskTemplates, deactivateTaskTemplate } from '../api/tasks-api';
import type { TaskTemplate } from '../types/tasks.types';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';

export function TasksTab({
  initialOpenCreate = false,
  onCreateHandled,
}: {
  initialOpenCreate?: boolean;
  onCreateHandled?: () => void;
}) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TaskTemplate | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (initialOpenCreate) {
      setCreateModalOpen(true);
      onCreateHandled?.();
    }
  }, [initialOpenCreate, onCreateHandled]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTaskTemplates({ includeInactive: showInactive });
      // Backend returns array directly, not wrapped in object
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tasks.errors.fetchFailed'));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateTaskTemplate(id);
      await fetchTemplates();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tasks.errors.deactivateFailed'));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t('tasks.title')}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowInactive(!showInactive)}>
            {showInactive ? t('tasks.hideInactive') : t('tasks.showInactive')}
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>+ {t('tasks.create')}</Button>
        </div>
      </div>

      {error && <Card className="p-3 text-sm text-red-700">{error}</Card>}

      {loading ? (
        <div className="text-center text-[rgb(var(--tc-muted))]">{t('common.loading')}</div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-lg font-medium text-[rgb(var(--tc-muted))]">
            {t('tasks.noTemplates')}
          </div>
          <p className="mt-2 text-sm text-[rgb(var(--tc-muted))]">{t('tasks.createFirst')}</p>
          <Button onClick={() => setCreateModalOpen(true)} className="mt-4" variant="secondary">
            {t('tasks.template')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{template.title}</h3>
                  {template.description && (
                    <p className="mt-1 truncate text-sm text-[rgb(var(--tc-muted))]">
                      {template.description}
                    </p>
                  )}
                </div>
                {!template.isActive && (
                  <span className="ml-2 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {t('tasks.inactive')}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs text-blue-800">
                  {template.category}
                </span>
                <span
                  className={`rounded-lg px-2 py-1 text-xs ${getPriorityColor(template.priority)}`}
                >
                  {template.priority}
                </span>
                {template.requiresPhoto && (
                  <span className="rounded-lg bg-purple-100 px-2 py-1 text-xs text-purple-800">
                    📷 {t('tasks.requiresPhoto')}
                  </span>
                )}
                {template.requiresComment && (
                  <span className="rounded-lg bg-purple-100 px-2 py-1 text-xs text-purple-800">
                    💬 {t('tasks.requiresComment')}
                  </span>
                )}
              </div>

              {template.estimatedMinutes && (
                <div className="mt-2 text-xs text-[rgb(var(--tc-muted))]">
                  {t('tasks.estimatedTime')}: {template.estimatedMinutes} мин
                </div>
              )}

              <div className="mt-auto flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditTemplate(template);
                    setEditModalOpen(true);
                  }}
                  className="flex-1 text-xs"
                >
                  {t('common.edit')}
                </Button>
                {template.isActive && (
                  <Button
                    variant="ghost"
                    onClick={() => handleDeactivate(template.id)}
                    className="flex-1 text-xs"
                  >
                    {t('tasks.deactivate')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchTemplates}
      />

      <EditTaskModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        template={editTemplate}
        onSuccess={fetchTemplates}
      />
    </div>
  );
}

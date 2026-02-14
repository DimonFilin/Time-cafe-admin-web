'use client';

import { useState, useEffect } from 'react';
import { getWorkerTasks, completeTask, uncompleteTask } from '../api/tasks-api';
import type { WorkerTask, TaskCategory, TaskPriority } from '../types/tasks.types';
import { PhotoUploadModal } from './PhotoUploadModal';
import { CommentInputModal } from './CommentInputModal';

type CategoryFilter = TaskCategory | 'ALL';

export function TasksTab() {
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<WorkerTask | null>(null);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [processingTask, setProcessingTask] = useState(false);

  const fetchTasks = async () => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const response = await getWorkerTasks(today);
      setTasks(response.tasks);
      setCompletedCount(response.completedCount);
      setTotalCount(response.totalCount);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTasks =
    category === 'ALL' ? tasks : tasks.filter((task) => task.category === category);

  const handleToggleTask = async (task: WorkerTask) => {
    if (processingTask) return;

    const today = new Date().toISOString().split('T')[0];

    if (task.completed) {
      // Uncomplete task - no validation needed
      try {
        setProcessingTask(true);
        await uncompleteTask(task.id, today);
        await fetchTasks();
      } catch (err) {
        console.error('Failed to uncomplete task:', err);
        alert(err instanceof Error ? err.message : 'Failed to update task');
      } finally {
        setProcessingTask(false);
      }
    } else {
      // Complete task - check requirements
      setCurrentTask(task);

      if (task.requiresPhoto && task.requiresComment) {
        // Both required - show photo modal first
        setPhotoModalOpen(true);
      } else if (task.requiresPhoto) {
        // Only photo required
        setPhotoModalOpen(true);
      } else if (task.requiresComment) {
        // Only comment required
        setCommentModalOpen(true);
      } else {
        // No requirements - complete directly
        await completeTaskDirectly(task.id, today);
      }
    }
  };

  const handlePhotoUpload = (photoUrl: string) => {
    if (!currentTask) return;

    setPendingPhotoUrl(photoUrl);

    // Check if comment is also required
    if (currentTask.requiresComment) {
      // Show comment modal next
      setCommentModalOpen(true);
    } else {
      // Complete task with photo only
      const today = new Date().toISOString().split('T')[0];
      completeTaskWithData(currentTask.id, today, photoUrl, undefined);
    }
  };

  const handleCommentSubmit = (comment: string) => {
    if (!currentTask) return;

    const today = new Date().toISOString().split('T')[0];

    // Complete task with comment and photo (if provided)
    completeTaskWithData(currentTask.id, today, pendingPhotoUrl || undefined, comment);
  };

  const completeTaskDirectly = async (taskId: string, date: string) => {
    try {
      setProcessingTask(true);
      await completeTask(taskId, { completionDate: date });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
      alert(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setProcessingTask(false);
      setCurrentTask(null);
    }
  };

  const completeTaskWithData = async (
    taskId: string,
    date: string,
    photoUrl?: string,
    comment?: string,
  ) => {
    try {
      setProcessingTask(true);
      await completeTask(taskId, {
        completionDate: date,
        photoUrl,
        comment,
      });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
      alert(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setProcessingTask(false);
      setCurrentTask(null);
      setPendingPhotoUrl(null);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'Высокий';
      case 'MEDIUM':
        return 'Средний';
      case 'LOW':
        return 'Низкий';
    }
  };

  const getCategoryLabel = (cat: CategoryFilter) => {
    switch (cat) {
      case 'OPENING':
        return 'Открытие смены';
      case 'SHIFT':
        return 'Во время смены';
      case 'CLOSING':
        return 'Закрытие смены';
      case 'GENERAL':
        return 'Общие';
      case 'ALL':
        return 'Все задачи';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-[rgb(var(--tc-muted))]">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h3 className="mb-2 text-lg font-medium text-red-900">Ошибка загрузки</h3>
        <p className="mb-4 text-sm text-red-700">{error}</p>
        <button
          onClick={fetchTasks}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Задачи</h2>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Чек-листы и задачи на смену</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[rgb(var(--tc-accent))]">
            {completedCount}/{totalCount}
          </div>
          <div className="text-xs text-[rgb(var(--tc-muted))]">Выполнено</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['ALL', 'OPENING', 'SHIFT', 'CLOSING', 'GENERAL'] as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-[rgb(var(--tc-accent))] text-white'
                : 'bg-[rgb(var(--tc-muted))]/10 text-[rgb(var(--tc-muted))] hover:bg-[rgb(var(--tc-muted))]/20'
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h3 className="mb-2 text-lg font-medium">Нет задач</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {category === 'ALL' ? 'На сегодня задач нет' : 'В этой категории пока нет задач'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-4 transition-opacity ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(task)}
                  className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    task.completed
                      ? 'border-[rgb(var(--tc-accent))] bg-[rgb(var(--tc-accent))] text-white'
                      : 'border-[rgb(var(--tc-border))] hover:border-[rgb(var(--tc-accent))]'
                  }`}
                >
                  {task.completed && <span className="text-sm">✓</span>}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 flex-wrap">
                    <h4
                      className={`break-words font-medium ${task.completed ? 'line-through' : ''}`}
                    >
                      {task.title}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                    {task.requiresPhoto && (
                      <span className="text-sm" title="Требуется фото">
                        📷
                      </span>
                    )}
                    {task.requiresComment && (
                      <span className="text-sm" title="Требуется комментарий">
                        💬
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="text-xs text-[rgb(var(--tc-muted))]">
                        ~{task.estimatedMinutes} мин
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="whitespace-pre-wrap break-words text-sm text-[rgb(var(--tc-muted))]">
                      {task.description}
                    </p>
                  )}
                  {task.completed && task.completedAt && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ Выполнено{' '}
                      {new Date(task.completedAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onUpload={handlePhotoUpload}
        taskTitle={currentTask?.title || ''}
      />
      <CommentInputModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        onSubmit={handleCommentSubmit}
        taskTitle={currentTask?.title || ''}
      />
    </div>
  );
}

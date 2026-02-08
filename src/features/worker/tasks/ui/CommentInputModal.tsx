'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';

interface CommentInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  taskTitle: string;
}

const MAX_COMMENT_LENGTH = 1000;

export function CommentInputModal({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
}: CommentInputModalProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    // Validate comment
    if (!comment.trim()) {
      setError('Пожалуйста, введите комментарий');
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      setError(`Комментарий не должен превышать ${MAX_COMMENT_LENGTH} символов`);
      return;
    }

    onSubmit(comment.trim());
    handleClose();
  };

  const handleClose = () => {
    setComment('');
    setError(null);
    onClose();
  };

  const remainingChars = MAX_COMMENT_LENGTH - comment.length;
  const isNearLimit = remainingChars < 50;

  return (
    <Modal open={isOpen} onClose={handleClose} title="Добавить комментарий">
      <div className="space-y-4">
        {/* Task info */}
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Задача:</span> {taskTitle}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            Для выполнения этой задачи требуется комментарий
          </p>
        </div>

        {/* Comment textarea */}
        <div>
          <label htmlFor="comment" className="mb-2 block text-sm font-medium">
            Комментарий
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError(null);
            }}
            placeholder="Опишите результат выполнения задачи..."
            rows={5}
            maxLength={MAX_COMMENT_LENGTH}
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm focus:border-[rgb(var(--tc-accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]/20"
          />

          {/* Character counter */}
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-[rgb(var(--tc-muted))]">Минимум 1 символ</p>
            <p
              className={`text-xs ${
                isNearLimit ? 'font-medium text-orange-600' : 'text-[rgb(var(--tc-muted))]'
              }`}
            >
              {remainingChars} / {MAX_COMMENT_LENGTH}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!comment.trim()}
            className="flex-1"
          >
            Добавить
          </Button>
        </div>
      </div>
    </Modal>
  );
}

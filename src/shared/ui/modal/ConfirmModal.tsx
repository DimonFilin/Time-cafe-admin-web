'use client';

import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';

export function ConfirmModal({
  open,
  title = 'Подтвердите действие',
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  isDanger,
  isLoading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description && <div className="text-sm text-[rgb(var(--tc-muted))]">{description}</div>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={isDanger ? 'primary' : 'primary'}
          className={
            isDanger ? 'bg-[rgb(var(--tc-danger))] hover:bg-[rgb(var(--tc-danger))]/90' : ''
          }
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? '...' : confirmText}
        </Button>
      </div>
    </Modal>
  );
}

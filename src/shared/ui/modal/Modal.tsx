'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { cn } from '@/shared/lib/cn';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeClassName: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-[1224px]',
};

export function Modal({
  open,
  title,
  children,
  onClose,
  size = 'md',
  contentClassName,
  bodyClassName,
}: {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  size?: ModalSize;
  contentClassName?: string;
  bodyClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Modal'}
    >
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close modal"
        type="button"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative flex w-full flex-col rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-5 shadow-xl',
          sizeClassName[size],
          'max-h-[calc(100vh-2rem)]',
          contentClassName,
        )}
      >
        {title && <div className="text-base font-semibold">{title}</div>}
        <div className={cn(title ? 'mt-4' : '', 'overflow-auto', bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}

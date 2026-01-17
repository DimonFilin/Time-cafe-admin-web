import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/shared/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tc-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--tc-bg))]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent-contrast))] hover:bg-[rgb(var(--tc-accent-2))]',
        variant === 'secondary' &&
          'border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] text-[rgb(var(--tc-fg))] hover:bg-[rgb(var(--tc-surface))]',
        variant === 'ghost' &&
          'text-[rgb(var(--tc-fg))] hover:bg-[rgb(var(--tc-surface))] hover:text-[rgb(var(--tc-fg))]',
        className,
      )}
      {...props}
    />
  );
});

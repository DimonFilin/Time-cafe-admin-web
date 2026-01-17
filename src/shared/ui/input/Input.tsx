import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/shared/lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-11 w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 text-sm',
        'text-[rgb(var(--tc-fg))] placeholder:text-[rgb(var(--tc-muted))]',
        'transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tc-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--tc-bg))]',
        className,
      )}
      {...props}
    />
  );
});

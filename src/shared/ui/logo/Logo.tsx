import Link from 'next/link';

import { cn } from '@/shared/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold tracking-tight',
        'text-[rgb(var(--tc-fg))] hover:bg-[rgb(var(--tc-surface))]',
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-lg bg-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent-contrast))]"
      >
        TC
      </span>
      <span>TimeCaffe</span>
    </Link>
  );
}

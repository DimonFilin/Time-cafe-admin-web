import type { AccountRole } from '@/shared/types/worker-role';
import { cn } from '@/shared/lib/cn';

function label(role: AccountRole) {
  if (role === 'USER') return 'User';
  if (role === 'SYSTEM_ADMIN') return 'System Admin';
  if (role === 'BRAND_ADMIN') return 'Brand Admin';
  if (role === 'CAFE_ADMIN') return 'Cafe Admin';
  return 'Worker';
}

export function RoleBadge({ role, className }: { role: AccountRole; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg bg-[rgb(var(--tc-accent))] px-2 py-1 text-[10px] font-semibold text-[rgb(var(--tc-accent-contrast))]',
        className,
      )}
    >
      {label(role)}
    </span>
  );
}

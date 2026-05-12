import type { AccountRole } from '@/shared/types/worker-role';
import { cn } from '@/shared/lib/cn';

function label(role: AccountRole) {
  if (role === 'USER') return 'Пользователь';
  if (role === 'SYSTEM_ADMIN') return 'Системный админ';
  if (role === 'BRAND_ADMIN') return 'Админ бренда';
  if (role === 'CAFE_ADMIN') return 'Админ кафе';
  return 'Работник';
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

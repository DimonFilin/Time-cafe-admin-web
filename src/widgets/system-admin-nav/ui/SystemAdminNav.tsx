'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/cn';
import { t } from '@/i18n';

const links = [
  { href: '/system-admin', label: t('systemAdmin.nav.overview') },
  { href: '/system-admin/storage', label: t('systemAdmin.nav.storage') },
  { href: '/system-admin/brands', label: t('systemAdmin.nav.brands') },
  { href: '/system-admin/cafes', label: t('systemAdmin.nav.cafes') },
  { href: '/system-admin/workers', label: t('systemAdmin.nav.workers') },
  { href: '/system-admin/worker-accounts', label: t('systemAdmin.nav.workerAccounts') },
  { href: '/system-admin/orders', label: t('systemAdmin.nav.orders') },
  { href: '/system-admin/appointments', label: t('systemAdmin.nav.appointments') },
  { href: '/system-admin/reviews', label: t('systemAdmin.nav.reviews') },
  { href: '/system-admin/regions', label: t('systemAdmin.nav.regions') },
  { href: '/system-admin/loyalty', label: 'Лояльность' },
  { href: '/system-admin/guests', label: 'Клиенты' },
  { href: '/system-admin/users', label: t('systemAdmin.nav.users') },
  { href: '/system-admin/transactions', label: t('systemAdmin.nav.transactions') },
];

export function SystemAdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'rounded-xl px-3 py-2 text-sm',
              active
                ? 'bg-[rgb(var(--tc-surface-2))] text-[rgb(var(--tc-fg))]'
                : 'text-[rgb(var(--tc-muted))] hover:bg-[rgb(var(--tc-surface-2))] hover:text-[rgb(var(--tc-fg))]',
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

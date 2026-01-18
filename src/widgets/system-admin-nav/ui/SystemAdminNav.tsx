'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/cn';

const links = [
  { href: '/system-admin', label: 'Обзор' },
  { href: '/system-admin/storage', label: 'Storage' },
  { href: '/system-admin/brands', label: 'Brands' },
  { href: '/system-admin/cafes', label: 'Cafes' },
  { href: '/system-admin/workers', label: 'Workers' },
  { href: '/system-admin/orders', label: 'Orders' },
  { href: '/system-admin/appointments', label: 'Appointments' },
  { href: '/system-admin/reviews', label: 'Reviews' },
  { href: '/system-admin/regions', label: 'Regions' },
  { href: '/system-admin/users', label: 'Users' },
  { href: '/system-admin/transactions', label: 'Transactions' },
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

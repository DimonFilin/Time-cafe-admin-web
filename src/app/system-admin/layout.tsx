import type { ReactNode } from 'react';

import { AppShell } from '@/widgets/layout/AppShell';
import { SystemAdminNav } from '@/widgets/system-admin-nav/ui/SystemAdminNav';

export default async function SystemAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="grid gap-6">
        <SystemAdminNav />
        {children}
      </div>
    </AppShell>
  );
}

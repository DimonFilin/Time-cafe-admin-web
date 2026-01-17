import { AppShell } from '@/widgets/layout/AppShell';
import { RoleDashboard } from '@/widgets/role-dashboard/ui/RoleDashboard';

export default function SystemAdminPage() {
  return (
    <AppShell>
      <RoleDashboard expectedRole="SYSTEM_ADMIN" />
    </AppShell>
  );
}

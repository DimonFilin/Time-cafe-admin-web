import { AppShell } from '@/widgets/layout/AppShell';
import { RoleDashboard } from '@/widgets/role-dashboard/ui/RoleDashboard';

export default function UserPage() {
  return (
    <AppShell>
      <RoleDashboard expectedRole="USER" />
    </AppShell>
  );
}

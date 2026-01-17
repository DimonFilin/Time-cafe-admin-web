import { AppShell } from '@/widgets/layout/AppShell';
import { RoleDashboard } from '@/widgets/role-dashboard/ui/RoleDashboard';

export default function CafeAdminPage() {
  return (
    <AppShell>
      <RoleDashboard expectedRole="CAFE_ADMIN" />
    </AppShell>
  );
}

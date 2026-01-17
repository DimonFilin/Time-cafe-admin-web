import { AppShell } from '@/widgets/layout/AppShell';
import { RoleDashboard } from '@/widgets/role-dashboard/ui/RoleDashboard';

export default function BrandAdminPage() {
  return (
    <AppShell>
      <RoleDashboard expectedRole="BRAND_ADMIN" />
    </AppShell>
  );
}

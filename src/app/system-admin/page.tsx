import { RoleDashboard } from '@/widgets/role-dashboard/ui/RoleDashboard';

export default function SystemAdminPage() {
  return <RoleDashboard expectedRole="SYSTEM_ADMIN" />;
}

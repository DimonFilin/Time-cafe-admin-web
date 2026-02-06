import { AppShell } from '@/widgets/layout/AppShell';
import { WorkerDashboard } from '@/features/worker/ui/WorkerDashboard';

export default function WorkerPage() {
  return (
    <AppShell>
      <WorkerDashboard />
    </AppShell>
  );
}

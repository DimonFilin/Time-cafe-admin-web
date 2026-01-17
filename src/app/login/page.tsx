import { AppShell } from '@/widgets/layout/AppShell';
import { LoginFlow } from '@/features/auth/login/ui/LoginFlow';

export default function LoginPage() {
  return (
    <AppShell>
      <LoginFlow />
    </AppShell>
  );
}

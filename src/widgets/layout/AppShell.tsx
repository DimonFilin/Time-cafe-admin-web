import type { ReactNode } from 'react';

import { Footer } from '@/widgets/footer/ui/Footer';
import { Header } from '@/widgets/header/ui/Header';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--tc-bg))]">
      <Header />
      <main className="mx-auto w-full max-w-[1224px] flex-1 px-4 py-10">{children}</main>
      <Footer />
    </div>
  );
}

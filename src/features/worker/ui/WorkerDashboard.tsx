'use client';

import { useState, useEffect } from 'react';
import { OrdersTab } from '../orders/ui/OrdersTab';
import { AppointmentsTab } from '../appointments/ui/AppointmentsTab';
import { TasksTab } from '../tasks/ui/TasksTab';
import { ProfileTab } from '../profile/ui/ProfileTab';

type TabId = 'orders' | 'appointments' | 'tasks' | 'profile';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'orders', label: 'Заказы', icon: '🛒' },
  { id: 'appointments', label: 'Бронирования', icon: '📅' },
  { id: 'tasks', label: 'Задачи', icon: '✅' },
  { id: 'profile', label: 'Профиль', icon: '👤' },
];

interface WorkerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  cafeId: string;
  cafe?: {
    id: string;
    name: string;
    address: string;
  };
}

export function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setWorker(data);
        }
      } catch (error) {
        console.error('Failed to fetch worker info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorker();
  }, []);

  const renderTab = () => {
    if (!worker) return null;

    switch (activeTab) {
      case 'orders':
        return <OrdersTab cafeId={worker.cafeId} />;
      case 'appointments':
        return <AppointmentsTab cafeId={worker.cafeId} />;
      case 'tasks':
        return <TasksTab workerId={worker.id} />;
      case 'profile':
        return <ProfileTab worker={worker} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-[rgb(var(--tc-error))]">
            Не удалось загрузить информацию о работнике
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header - Desktop */}
      <header className="hidden border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-4 md:block">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {worker.firstName} {worker.lastName}
            </h1>
            <p className="text-sm text-[rgb(var(--tc-muted))]">
              {worker.cafe?.name || 'Кафе'} • Работник
            </p>
          </div>
          <div className="text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700">
              🟢 На смене
            </span>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{renderTab()}</main>

      {/* Bottom navigation - Mobile */}
      <nav className="border-t border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] md:hidden">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-center transition-colors ${
                activeTab === tab.id
                  ? 'border-t-2 border-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent))]'
                  : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]'
              }`}
            >
              <div className="text-xl">{tab.icon}</div>
              <div className="text-xs">{tab.label}</div>
            </button>
          ))}
        </div>
      </nav>

      {/* Side navigation - Desktop */}
      <aside className="fixed left-0 top-16 hidden h-full w-64 border-r border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-4 md:block">
        <nav className="space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-[rgb(var(--tc-accent))]/10 text-[rgb(var(--tc-accent))]'
                  : 'hover:bg-[rgb(var(--tc-muted))]/10'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
}

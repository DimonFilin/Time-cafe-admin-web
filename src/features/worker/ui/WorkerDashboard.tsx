'use client';

import { useState, useEffect } from 'react';
import { workerApi } from '../api/worker-api';
import type { WorkerWithRelations } from '../types/worker.types';
import { OrdersTab } from '../orders/ui/OrdersTab';
import { AppointmentsTab } from '../appointments/ui/AppointmentsTab';
import { TasksTab } from '../tasks/ui/TasksTab';
import { ProfileTab } from '../profile/ui/ProfileTab';
import { ChatsTab } from '@/features/chats/ui/ChatsTab';
import { chatsApi } from '@/features/chats/api/chats-api';

type Tab = 'orders' | 'appointments' | 'tasks' | 'chats' | 'profile';

export function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [worker, setWorker] = useState<WorkerWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const data = await workerApi.getMe();
        setWorker(data);
      } catch (error) {
        console.error('Failed to fetch worker:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, []);

  useEffect(() => {
    const refreshUnread = async () => {
      try {
        const data = await chatsApi.list({ unreadOnly: true, limit: 1 });
        setUnreadChatsCount(data.total || 0);
      } catch {
        // noop
      }
    };
    void refreshUnread();
    const timer = setInterval(() => void refreshUnread(), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleShiftToggle = async () => {
    if (!worker) return;

    try {
      const newStatus = worker.shiftStatus === 'ON_SHIFT' ? 'OFF_SHIFT' : 'ON_SHIFT';
      await workerApi.toggleShiftStatus();
      setWorker({ ...worker, shiftStatus: newStatus });

      // Show notification
      const message = newStatus === 'ON_SHIFT' ? 'Вы начали смену!' : 'Вы завершили смену';
      alert(message);
    } catch (error) {
      console.error('Failed to toggle shift status:', error);
      alert('Не удалось изменить статус смены');
    }
  };

  const tabs = [
    { id: 'orders' as Tab, label: 'Заказы', icon: '📦' },
    { id: 'appointments' as Tab, label: 'Бронирования', icon: '📅' },
    { id: 'tasks' as Tab, label: 'Задачи', icon: '✓' },
    {
      id: 'chats' as Tab,
      label: unreadChatsCount > 0 ? `Чаты (${unreadChatsCount})` : 'Чаты',
      icon: '💬',
    },
    { id: 'profile' as Tab, label: 'Профиль', icon: '👤' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold">Ошибка загрузки</h2>
          <p className="text-[rgb(var(--tc-muted))]">Не удалось загрузить данные работника</p>
        </div>
      </div>
    );
  }

  if (!worker.cafeId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold">Работник не привязан к кафе</h2>
          <p className="text-[rgb(var(--tc-muted))]">
            Обратитесь к администратору для назначения кафе
          </p>
          <div className="mt-4 text-xs text-[rgb(var(--tc-muted))]">Worker ID: {worker.id}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[rgb(var(--tc-bg))]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden border-r border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] transition-all duration-300 md:flex md:flex-col ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Header */}
        <div className="border-b border-[rgb(var(--tc-border))] p-4">
          {!sidebarCollapsed ? (
            <>
              <div className="mb-2">
                <div className="text-lg font-semibold">
                  {worker.firstName} {worker.lastName}
                </div>
                <div className="text-xs text-[rgb(var(--tc-muted))]">{worker.email}</div>
              </div>
              <div className="mb-2 text-sm">
                <span className="font-medium">{worker.cafe?.name || 'Кафе'}</span>
                <span className="text-[rgb(var(--tc-muted))]"> • Работник</span>
              </div>
              <button
                onClick={handleShiftToggle}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                  worker.shiftStatus === 'ON_SHIFT'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span
                  className={`text-lg ${worker.shiftStatus === 'ON_SHIFT' ? 'animate-pulse' : ''}`}
                >
                  {worker.shiftStatus === 'ON_SHIFT' ? '🟢' : '⚪'}
                </span>
                <span>{worker.shiftStatus === 'ON_SHIFT' ? 'На смене' : 'Не на смене'}</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="text-center text-sm font-semibold">
                {worker.firstName?.[0]}
                {worker.lastName?.[0]}
              </div>
              <button
                onClick={handleShiftToggle}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                  worker.shiftStatus === 'ON_SHIFT'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={worker.shiftStatus === 'ON_SHIFT' ? 'На смене' : 'Не на смене'}
              >
                <span
                  className={`text-lg ${worker.shiftStatus === 'ON_SHIFT' ? 'animate-pulse' : ''}`}
                >
                  {worker.shiftStatus === 'ON_SHIFT' ? '🟢' : '⚪'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-[rgb(var(--tc-accent))] text-white'
                  : 'text-[rgb(var(--tc-muted))] hover:bg-[rgb(var(--tc-muted))]/10'
              } ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
              title={sidebarCollapsed ? tab.label : undefined}
            >
              <span className="text-lg">{tab.icon}</span>
              {!sidebarCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle Button */}
        <div className="border-t border-[rgb(var(--tc-border))] p-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[rgb(var(--tc-muted))] transition-colors hover:bg-[rgb(var(--tc-muted))]/10"
            title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            <span className="text-lg">{sidebarCollapsed ? '→' : '←'}</span>
            {!sidebarCollapsed && <span>Свернуть</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-7xl p-4 md:p-6">
          {activeTab === 'orders' && <OrdersTab cafeId={worker.cafeId} />}
          {activeTab === 'appointments' && <AppointmentsTab cafeId={worker.cafeId} />}
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'chats' && <ChatsTab />}
          {activeTab === 'profile' && <ProfileTab worker={worker} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
              activeTab === tab.id ? 'text-[rgb(var(--tc-accent))]' : 'text-[rgb(var(--tc-muted))]'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

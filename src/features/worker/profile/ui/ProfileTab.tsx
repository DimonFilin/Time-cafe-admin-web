'use client';

import type { WorkerWithRelations } from '../../types/worker.types';

interface ProfileTabProps {
  worker: WorkerWithRelations;
}

export function ProfileTab({ worker }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Профиль</h2>
        <p className="text-sm text-[rgb(var(--tc-muted))]">Личная информация и настройки</p>
      </div>

      {/* Personal Info Card */}
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">Личные данные</h3>
        <div className="space-y-4">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--tc-accent))]/10 text-3xl">
              👤
            </div>
            <div>
              <div className="text-xl font-semibold">
                {worker.firstName} {worker.lastName}
              </div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">Работник</div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">ID работника</div>
              <div className="font-mono text-sm">{worker.id}</div>
            </div>
            <div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">Кафе</div>
              <div className="font-medium">{worker.cafe?.name || 'Не назначено'}</div>
            </div>
            <div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">Бренд</div>
              <div className="font-medium">{worker.brand?.name || 'Не назначен'}</div>
            </div>
            <div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">Статус смены</div>
              <div className="flex items-center gap-2">
                <span className={worker.shiftStatus === 'ON_SHIFT' ? 'animate-pulse' : ''}>
                  {worker.shiftStatus === 'ON_SHIFT' ? '🟢' : '⚪'}
                </span>
                <span className="font-medium">
                  {worker.shiftStatus === 'ON_SHIFT' ? 'На смене' : 'Не на смене'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Card */}
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">Моя статистика</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-[rgb(var(--tc-muted))]/5 p-4">
            <div className="text-2xl font-bold text-[rgb(var(--tc-accent))]">-</div>
            <div className="text-sm text-[rgb(var(--tc-muted))]">Заказов сегодня</div>
          </div>
          <div className="rounded-lg bg-[rgb(var(--tc-muted))]/5 p-4">
            <div className="text-2xl font-bold text-[rgb(var(--tc-accent))]">-</div>
            <div className="text-sm text-[rgb(var(--tc-muted))]">Бронирований сегодня</div>
          </div>
          <div className="rounded-lg bg-[rgb(var(--tc-muted))]/5 p-4">
            <div className="text-2xl font-bold text-[rgb(var(--tc-accent))]">-</div>
            <div className="text-sm text-[rgb(var(--tc-muted))]">Задач выполнено</div>
          </div>
        </div>
        <p className="mt-4 text-xs text-[rgb(var(--tc-muted))]">
          Статистика будет доступна после интеграции с системой аналитики
        </p>
      </div>

      {/* Schedule Card */}
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">Расписание</h3>
        <div className="rounded-lg bg-[rgb(var(--tc-muted))]/5 p-8 text-center">
          <div className="mb-4 text-4xl">📅</div>
          <h4 className="mb-2 text-lg font-medium">Расписание смен</h4>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            Функционал расписания будет доступен в следующей версии
          </p>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">Уведомления</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Новые заказы</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Новые бронирования</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Напоминания о задачах</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Сообщения от администратора</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
        </div>
        <p className="mt-4 text-xs text-[rgb(var(--tc-muted))]">
          Настройки уведомлений будут сохранены в следующей версии
        </p>
      </div>
    </div>
  );
}

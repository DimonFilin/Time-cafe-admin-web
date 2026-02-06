'use client';

import { useState } from 'react';

interface OrdersTabProps {
  cafeId: string;
}

export function OrdersTab({ cafeId }: OrdersTabProps) {
  const [filter, setFilter] = useState<'active' | 'history'>('active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Заказы</h2>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Управление заказами кафе</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-[rgb(var(--tc-border))]">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'border-b-2 border-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent))]'
              : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]'
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'history'
              ? 'border-b-2 border-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent))]'
              : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]'
          }`}
        >
          История
        </button>
      </div>

      {/* Content placeholder */}
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
        <div className="text-4xl mb-4">🛒</div>
        <h3 className="text-lg font-medium mb-2">Заказы</h3>
        <p className="text-sm text-[rgb(var(--tc-muted))]">
          Здесь будет список {filter === 'active' ? 'активных' : 'завершенных'} заказов
        </p>
        <p className="text-xs text-[rgb(var(--tc-muted))] mt-2">Cafe ID: {cafeId}</p>
      </div>
    </div>
  );
}

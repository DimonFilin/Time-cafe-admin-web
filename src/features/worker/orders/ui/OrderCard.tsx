'use client';

import { useState } from 'react';
import type { Order } from '../types/orders.types';
import { Button } from '@/shared/ui/button/Button';

interface OrderCardProps {
  order: Order;
  onConfirm: (orderId: string) => void;
  onComplete: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтвержден',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

const DELIVERY_TYPE_LABELS = {
  IN_CAFE: 'В кафе',
  TAKEOUT: 'С собой',
  DELIVERY: 'Доставка',
};

export function OrderCard({
  order,
  onConfirm,
  onComplete,
  onCancel,
  onViewDetails,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-4 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
            >
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {order.user.firstName} {order.user.lastName}
            {order.user.phone && ` • ${order.user.phone}`}
          </p>
          <p className="text-xs text-[rgb(var(--tc-muted))]">
            {formatDate(order.createdAt)} • {DELIVERY_TYPE_LABELS[order.deliveryType]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{order.totalAmount}₽</div>
          <div className="text-xs text-[rgb(var(--tc-muted))]">
            {order.items.length} {order.items.length === 1 ? 'позиция' : 'позиций'}
          </div>
        </div>
      </div>

      {/* Items preview */}
      <div className="mt-3 space-y-1">
        {order.items.slice(0, isExpanded ? undefined : 2).map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-[rgb(var(--tc-muted))]">
              {item.quantity}x {item.itemName}
            </span>
            <span>{item.totalPrice}₽</span>
          </div>
        ))}
        {order.items.length > 2 && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-[rgb(var(--tc-accent))] hover:underline"
          >
            Показать еще {order.items.length - 2}
          </button>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mt-3 rounded bg-[rgb(var(--tc-muted))]/10 p-2 text-sm">
          <span className="font-medium">Примечание:</span> {order.notes}
        </div>
      )}

      {/* Delivery info */}
      {order.deliveryType === 'DELIVERY' && order.deliveryAddress && (
        <div className="mt-3 rounded bg-blue-50 p-2 text-sm">
          <span className="font-medium">Адрес доставки:</span> {order.deliveryAddress}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === 'PENDING' && (
          <>
            <Button onClick={() => onConfirm(order.id)} className="flex-1 md:flex-none">
              ✓ Подтвердить
            </Button>
            <Button
              variant="secondary"
              onClick={() => onCancel(order.id)}
              className="flex-1 md:flex-none"
            >
              ✕ Отменить
            </Button>
          </>
        )}
        {order.status === 'CONFIRMED' && (
          <>
            <Button onClick={() => onComplete(order.id)} className="flex-1 md:flex-none">
              ✓ Завершить
            </Button>
            <Button
              variant="secondary"
              onClick={() => onCancel(order.id)}
              className="flex-1 md:flex-none"
            >
              ✕ Отменить
            </Button>
          </>
        )}
        <Button
          variant="secondary"
          onClick={() => onViewDetails(order)}
          className="flex-1 md:flex-none"
        >
          📋 Детали
        </Button>
      </div>
    </div>
  );
}

'use client';

import { Modal } from '@/shared/ui/modal/Modal';
import type { Order } from '../types/orders.types';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтвержден',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

const DELIVERY_TYPE_LABELS = {
  IN_CAFE: 'В кафе',
  TAKEOUT: 'С собой',
  DELIVERY: 'Доставка',
};

const PAYMENT_METHOD_LABELS = {
  CARD: 'Карта',
  BALANCE: 'Баланс',
  CASH: 'Наличные',
};

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={`Заказ #${order.orderNumber}`}>
      <div className="space-y-6">
        {/* Status */}
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Статус</h3>
          <p className="mt-1 text-lg font-semibold">{STATUS_LABELS[order.status]}</p>
        </div>

        {/* Customer */}
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Клиент</h3>
          <p className="mt-1">
            {order.user.firstName} {order.user.lastName}
          </p>
          {order.user.phone && (
            <p className="text-sm text-[rgb(var(--tc-muted))]">{order.user.phone}</p>
          )}
        </div>

        {/* Order info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Тип доставки</h3>
            <p className="mt-1">{DELIVERY_TYPE_LABELS[order.deliveryType]}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Способ оплаты</h3>
            <p className="mt-1">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          </div>
        </div>

        {/* Delivery address */}
        {order.deliveryType === 'DELIVERY' && order.deliveryAddress && (
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Адрес доставки</h3>
            <p className="mt-1">{order.deliveryAddress}</p>
            {order.contactPhone && (
              <p className="text-sm text-[rgb(var(--tc-muted))]">Телефон: {order.contactPhone}</p>
            )}
          </div>
        )}

        {/* Items */}
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Позиции заказа</h3>
          <div className="mt-2 space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-lg border border-[rgb(var(--tc-border))] p-3"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-sm text-[rgb(var(--tc-muted))]">
                    {item.quantity} x {item.unitPrice}₽
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
                      Примечание: {item.notes}
                    </p>
                  )}
                </div>
                <div className="text-right font-semibold">{item.totalPrice}₽</div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-[rgb(var(--tc-border))] pt-4">
          <div className="flex items-center justify-between text-xl font-bold">
            <span>Итого:</span>
            <span>{order.totalAmount}₽</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Примечание к заказу</h3>
            <p className="mt-1 rounded-lg bg-[rgb(var(--tc-muted))]/10 p-3">{order.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[rgb(var(--tc-muted))]">Создан:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          {order.confirmedAt && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--tc-muted))]">Подтвержден:</span>
              <span>{formatDate(order.confirmedAt)}</span>
            </div>
          )}
          {order.completedAt && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--tc-muted))]">Завершен:</span>
              <span>{formatDate(order.completedAt)}</span>
            </div>
          )}
          {order.cancelledAt && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--tc-muted))]">Отменен:</span>
              <span>{formatDate(order.cancelledAt)}</span>
            </div>
          )}
        </div>

        {/* Cancellation reason */}
        {order.status === 'CANCELLED' && order.cancellationReason && (
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Причина отмены</h3>
            <p className="mt-1 rounded-lg bg-red-50 p-3 text-red-700">{order.cancellationReason}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

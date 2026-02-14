'use client';

import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '../api/orders-api';
import type { Order } from '../types/orders.types';
import { OrderCard } from './OrderCard';
import { OrderDetailsModal } from './OrderDetailsModal';
import { CancelOrderModal } from './CancelOrderModal';

interface OrdersTabProps {
  cafeId: string;
}

export function OrdersTab({ cafeId }: OrdersTabProps) {
  const [filter, setFilter] = useState<'active' | 'history'>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!cafeId) {
      console.error('[OrdersTab] cafeId is missing, cannot fetch orders');
      setError('Не удалось определить кафе работника');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response =
        filter === 'active'
          ? await ordersApi.getActiveOrders(cafeId)
          : await ordersApi.getOrdersHistory(cafeId);
      setOrders(response.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Не удалось загрузить заказы');
      setOrders([]); // Очищаем список при ошибке
    } finally {
      setLoading(false);
    }
  }, [cafeId, filter]);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds for active orders
    if (filter === 'active' && cafeId) {
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [cafeId, fetchOrders, filter]);

  const handleConfirm = async (orderId: string) => {
    try {
      await ordersApi.confirmOrder({ orderId, cafeId });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to confirm order:', err);
      alert('Не удалось подтвердить заказ');
    }
  };

  const handleComplete = async (orderId: string) => {
    try {
      await ordersApi.completeOrder({ orderId, cafeId });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to complete order:', err);
      alert('Не удалось завершить заказ');
    }
  };

  const handleCancelClick = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setOrderToCancel(order);
      setIsCancelModalOpen(true);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!orderToCancel) return;

    try {
      await ordersApi.cancelOrder({ orderId: orderToCancel.id, cafeId, reason });
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Не удалось отменить заказ');
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Заказы</h2>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Управление заказами кафе</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="rounded-lg border border-[rgb(var(--tc-border))] px-4 py-2 text-sm transition-colors hover:bg-[rgb(var(--tc-muted))]/10"
          >
            🔄 Обновить
          </button>
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
          Активные {filter === 'active' && orders.length > 0 && `(${orders.length})`}
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

      {/* Content */}
      {loading ? (
        <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
          <div className="text-lg">Загрузка заказов...</div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <div className="text-lg text-red-700">{error}</div>
          <button
            onClick={fetchOrders}
            className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200"
          >
            Попробовать снова
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-medium mb-2">Нет заказов</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {filter === 'active' ? 'Активных заказов пока нет' : 'История заказов пуста'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onConfirm={handleConfirm}
              onComplete={handleComplete}
              onCancel={handleCancelClick}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        orderNumber={orderToCancel?.orderNumber || ''}
      />
    </div>
  );
}

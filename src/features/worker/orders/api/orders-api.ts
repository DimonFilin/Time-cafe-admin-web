import { clientFetch } from '@/shared/lib/client-fetch';
import type {
  Order,
  OrdersResponse,
  ConfirmOrderDto,
  CompleteOrderDto,
  CancelOrderDto,
} from '../types/orders.types';

export const ordersApi = {
  // Получить активные заказы
  async getActiveOrders(cafeId: string): Promise<OrdersResponse> {
    return clientFetch<OrdersResponse>(
      `/api/cafe-worker/orders?cafeId=${cafeId}&status=PENDING,CONFIRMED`,
    );
  },

  // Получить историю заказов
  async getOrdersHistory(cafeId: string): Promise<OrdersResponse> {
    return clientFetch<OrdersResponse>(
      `/api/cafe-worker/orders?cafeId=${cafeId}&status=COMPLETED,CANCELLED`,
    );
  },

  // Получить детали заказа
  async getOrderById(orderId: string, cafeId: string): Promise<Order> {
    return clientFetch<Order>(`/api/cafe-worker/orders/${orderId}?cafeId=${cafeId}`);
  },

  // Подтвердить заказ
  async confirmOrder(dto: ConfirmOrderDto): Promise<Order> {
    return clientFetch<Order>(
      `/api/cafe-worker/orders/${dto.orderId}/confirm?cafeId=${dto.cafeId}`,
      {
        method: 'PATCH',
      },
    );
  },

  // Завершить заказ
  async completeOrder(dto: CompleteOrderDto): Promise<Order> {
    return clientFetch<Order>(
      `/api/cafe-worker/orders/${dto.orderId}/complete?cafeId=${dto.cafeId}`,
      {
        method: 'PATCH',
      },
    );
  },

  // Отменить заказ
  async cancelOrder(dto: CancelOrderDto): Promise<Order> {
    return clientFetch<Order>(
      `/api/cafe-worker/orders/${dto.orderId}/cancel?cafeId=${dto.cafeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ reason: dto.reason }),
      },
    );
  },
};

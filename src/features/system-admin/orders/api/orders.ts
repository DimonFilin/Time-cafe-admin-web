'use client';

import type { Order, OrderListResponse, OrderStatus } from '@/entities/order/types/order';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listCafeOrders(input: {
  cafeId: string;
  page: number;
  limit: number;
  status?: OrderStatus;
  from?: string;
  to?: string;
}): Promise<OrderListResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(input.page));
  qs.set('limit', String(input.limit));
  if (input.status) qs.set('status', input.status);
  if (input.from) qs.set('from', input.from);
  if (input.to) qs.set('to', input.to);
  const res = await fetch(`/api/system-admin/orders/cafe/${input.cafeId}?${qs.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as OrderListResponse;
}

export async function getCafeOrder(input: { cafeId: string; id: string }): Promise<Order> {
  const res = await fetch(`/api/system-admin/orders/cafe/${input.cafeId}/${input.id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Order;
}

export async function updateOrderStatus(input: {
  id: string;
  status: OrderStatus;
  cancellationReason?: string;
}): Promise<Order> {
  const res = await fetch(`/api/system-admin/orders/${input.id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      status: input.status,
      cancellationReason: input.cancellationReason?.trim() || undefined,
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Order;
}

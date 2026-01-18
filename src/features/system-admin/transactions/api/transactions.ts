'use client';

import type {
  Transaction,
  TransactionListResponse,
  TransactionListQuery,
  CreateRefundData,
} from '@/entities/transaction/types/transaction';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  try {
    const json = await res.json();
    return formatApiErrorFromText(JSON.stringify(json));
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function listTransactions(
  query?: TransactionListQuery,
): Promise<TransactionListResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', query.page.toString());
  if (query?.limit) params.set('limit', query.limit.toString());
  if (query?.userId) params.set('userId', query.userId);
  if (query?.type) params.set('type', query.type);
  if (query?.status) params.set('status', query.status);
  if (query?.orderId) params.set('orderId', query.orderId);

  const queryString = params.toString();
  const url = `/api/system-admin/transactions${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as TransactionListResponse;
}

export async function getTransaction(id: string): Promise<Transaction> {
  const res = await fetch(`/api/system-admin/transactions/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Transaction;
}

export async function createRefund(
  transactionId: string,
  data: CreateRefundData,
): Promise<Transaction> {
  const res = await fetch(`/api/system-admin/transactions/${transactionId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Transaction;
}

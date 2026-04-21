'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  Transaction,
  TransactionListQuery,
  TransactionType,
  TransactionStatus,
} from '@/entities/transaction/types/transaction';
import { createRefund, getTransaction, listTransactions } from '../api/transactions';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { Modal } from '@/shared/ui/modal/Modal';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';

export function TransactionsAdmin() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    userId: '',
    type: '' as '' | TransactionType,
    status: '' as '' | TransactionStatus,
    orderId: '',
  });

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<Transaction | null>(null);

  // Refund modal
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundTransaction, setRefundTransaction] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundDescription, setRefundDescription] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: TransactionListQuery = {
        page,
        limit: 20,
        userId: filters.userId.trim() || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        orderId: filters.orderId.trim() || undefined,
      };
      const data = await listTransactions(query);
      setTransactions(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openDetails = useCallback(async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetails(null);
    try {
      const data = await getTransaction(id);
      setDetails(data);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Failed to load transaction');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleRefund = useCallback(async () => {
    if (!refundTransaction) return;

    setRefundLoading(true);
    setRefundError(null);
    try {
      const amount = refundAmount.trim() === '' ? undefined : Number(refundAmount);
      await createRefund(refundTransaction.id, {
        amount: amount !== undefined && Number.isFinite(amount) ? amount : undefined,
        description: refundDescription.trim() || undefined,
      });
      setRefundOpen(false);
      setRefundTransaction(null);
      setRefundAmount('');
      setRefundDescription('');
      await refresh();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'Failed to create refund');
    } finally {
      setRefundLoading(false);
    }
  }, [refundTransaction, refundAmount, refundDescription, refresh]);

  const columns = useMemo<DataTableColumn<Transaction>[]>(
    () => [
      {
        key: 'id',
        header: 'ID',
        render: (t) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{t.id}</span>
        ),
      },
      {
        key: 'user',
        header: 'User',
        render: (t) => (
          <div>
            {t.user ? (
              <>
                <div className="font-medium">
                  {t.user.firstName} {t.user.lastName}
                </div>
                <div className="text-xs text-[rgb(var(--tc-muted))]">{t.user.email}</div>
              </>
            ) : (
              <span className="text-xs text-[rgb(var(--tc-muted))]">{t.userId}</span>
            )}
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (t) => (
          <span
            className={`font-mono text-xs ${
              t.type === 'PAYMENT'
                ? 'text-[rgb(var(--tc-success))]'
                : 'text-[rgb(var(--tc-warning))]'
            }`}
          >
            {t.type}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (t) => <span className="font-mono text-xs">{t.status}</span>,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (t) => (
          <span className="font-mono">
            <MoneyAmount value={t.amount} />
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (t) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(t.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (t) => (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openDetails(t.id)}>
              View
            </Button>
            {t.type === 'PAYMENT' && t.status === 'COMPLETED' && (
              <Button
                variant="ghost"
                onClick={() => {
                  setRefundTransaction(t);
                  setRefundAmount('');
                  setRefundDescription('');
                  setRefundError(null);
                  setRefundOpen(true);
                }}
              >
                Refund
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openDetails],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Transactions (SYSTEM_ADMIN)</div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            View all transactions and create refunds for completed payments.
          </div>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">User ID</div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.userId}
              onChange={(e) => setFilters((s) => ({ ...s, userId: e.target.value }))}
              placeholder="Filter by user ID"
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Type</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.type}
              onChange={(e) =>
                setFilters((s) => ({ ...s, type: e.target.value as '' | TransactionType }))
              }
            >
              <option value="">All</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="REFUND">REFUND</option>
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Status</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters((s) => ({ ...s, status: e.target.value as '' | TransactionStatus }))
              }
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Order ID</div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.orderId}
              onChange={(e) => setFilters((s) => ({ ...s, orderId: e.target.value }))}
              placeholder="Filter by order ID"
            />
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 text-sm text-[rgb(var(--tc-danger))] bg-[rgb(var(--tc-danger))]/10">
          {error}
        </Card>
      )}

      <DataTable
        rows={transactions}
        columns={columns}
        getRowId={(t) => t.id}
        isLoading={loading}
        error={null}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={() => {}}
      />

      {/* Details Modal */}
      <Modal
        open={detailsOpen}
        title="Transaction Details"
        onClose={() => setDetailsOpen(false)}
        size="2xl"
      >
        <div className="grid gap-3">
          {detailsError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{detailsError}</Card>
          )}
          {detailsLoading ? (
            <div className="text-sm text-[rgb(var(--tc-muted))]">Загрузка...</div>
          ) : details ? (
            <div className="grid gap-3 text-sm">
              <div>
                <span className="text-[rgb(var(--tc-muted))]">id:</span>{' '}
                <span className="font-mono">{details.id}</span>
              </div>
              <div>
                <span className="text-[rgb(var(--tc-muted))]">user:</span>{' '}
                {details.user ? (
                  <>
                    {details.user.firstName} {details.user.lastName} ({details.user.email})
                  </>
                ) : (
                  <span className="font-mono">{details.userId}</span>
                )}
              </div>
              <div>
                <span className="text-[rgb(var(--tc-muted))]">type:</span>{' '}
                <span className="font-mono">{details.type}</span>
              </div>
              <div>
                <span className="text-[rgb(var(--tc-muted))]">status:</span>{' '}
                <span className="font-mono">{details.status}</span>
              </div>
              <div>
                <span className="text-[rgb(var(--tc-muted))]">amount:</span>{' '}
                <span className="font-mono">
                  <MoneyAmount value={details.amount} />
                </span>
              </div>
              {details.orderId && (
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">order:</span>{' '}
                  {details.order ? (
                    <>
                      {details.order.orderNumber} ({details.order.status})
                    </>
                  ) : (
                    <span className="font-mono">{details.orderId}</span>
                  )}
                </div>
              )}
              {details.cardId && (
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">card:</span>{' '}
                  {details.card ? (
                    <>
                      {details.card.cardType} ****{details.card.last4Digits}
                    </>
                  ) : (
                    <span className="font-mono">{details.cardId}</span>
                  )}
                </div>
              )}
              {details.provider && (
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">provider:</span>{' '}
                  <span className="font-mono">{details.provider}</span>
                </div>
              )}
              {details.providerTransactionId && (
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">providerTransactionId:</span>{' '}
                  <span className="font-mono">{details.providerTransactionId}</span>
                </div>
              )}
              {details.description && (
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">description:</span>{' '}
                  {details.description}
                </div>
              )}
              <div>
                <span className="text-[rgb(var(--tc-muted))]">createdAt:</span>{' '}
                <span className="font-mono">{new Date(details.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal
        open={refundOpen}
        title="Create Refund"
        onClose={() => setRefundOpen(false)}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={refundLoading}>
              {refundLoading ? 'Creating...' : 'Create Refund'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {refundError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{refundError}</Card>
          )}
          {refundTransaction && (
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-[rgb(var(--tc-muted))]">Transaction ID:</span>{' '}
                <span className="font-mono">{refundTransaction.id}</span>
              </div>
              <div>
                <span className="text-[rgb(var(--tc-muted))]">Original Amount:</span>{' '}
                <span className="font-mono">
                  <MoneyAmount value={refundTransaction.amount} />
                </span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">
              Refund Amount (leave empty for full refund)
            </label>
            <input
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              value={refundDescription}
              onChange={(e) => setRefundDescription(e.target.value)}
              className="w-full rounded-md border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
              placeholder="Refund description"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

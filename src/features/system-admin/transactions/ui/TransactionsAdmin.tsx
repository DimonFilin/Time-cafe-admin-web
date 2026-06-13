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
import { t } from '@/i18n';

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
      setError(err instanceof Error ? err.message : t('systemAdmin.errors.loadTransactions'));
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
      setDetailsError(err instanceof Error ? err.message : t('systemAdmin.errors.loadTransaction'));
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
      setRefundError(err instanceof Error ? err.message : t('systemAdmin.errors.createRefund'));
    } finally {
      setRefundLoading(false);
    }
  }, [refundTransaction, refundAmount, refundDescription, refresh]);

  const columns = useMemo<DataTableColumn<Transaction>[]>(
    () => [
      {
        key: 'id',
        header: t('common.id'),
        render: (row) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{row.id}</span>
        ),
      },
      {
        key: 'user',
        header: t('systemAdmin.transactions.user'),
        render: (row) => (
          <div>
            {row.user ? (
              <>
                <div className="font-medium">
                  {row.user.firstName} {row.user.lastName}
                </div>
                <div className="text-xs text-[rgb(var(--tc-muted))]">{row.user.email}</div>
              </>
            ) : (
              <span className="text-xs text-[rgb(var(--tc-muted))]">{row.userId}</span>
            )}
          </div>
        ),
      },
      {
        key: 'type',
        header: t('systemAdmin.transactions.type'),
        render: (row) => (
          <span
            className={`font-mono text-xs ${
              row.type === 'PAYMENT'
                ? 'text-[rgb(var(--tc-success))]'
                : 'text-[rgb(var(--tc-warning))]'
            }`}
          >
            {row.type}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => <span className="font-mono text-xs">{row.status}</span>,
      },
      {
        key: 'amount',
        header: t('systemAdmin.transactions.amount'),
        render: (row) => (
          <span className="font-mono">
            <MoneyAmount value={row.amount} />
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: t('workers.created'),
        render: (row) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(row.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openDetails(row.id)}>
              {t('common.view')}
            </Button>
            {row.type === 'PAYMENT' && row.status === 'COMPLETED' && (
              <Button
                variant="ghost"
                onClick={() => {
                  setRefundTransaction(row);
                  setRefundAmount('');
                  setRefundDescription('');
                  setRefundError(null);
                  setRefundOpen(true);
                }}
              >
                {t('systemAdmin.transactions.refund')}
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
          <div className="text-2xl font-semibold tracking-tight">
            {t('systemAdmin.transactions.title')}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.transactions.subtitle')}
          </div>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          {t('common.refresh')}
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.transactions.userId')}
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.userId}
              onChange={(e) => setFilters((s) => ({ ...s, userId: e.target.value }))}
              placeholder={t('systemAdmin.transactions.filterByUserId')}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.transactions.type')}
            </div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.type}
              onChange={(e) =>
                setFilters((s) => ({ ...s, type: e.target.value as '' | TransactionType }))
              }
            >
              <option value="">{t('common.all')}</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="REFUND">REFUND</option>
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('common.status')}</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters((s) => ({ ...s, status: e.target.value as '' | TransactionStatus }))
              }
            >
              <option value="">{t('common.all')}</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.transactions.orderId')}
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.orderId}
              onChange={(e) => setFilters((s) => ({ ...s, orderId: e.target.value }))}
              placeholder={t('systemAdmin.transactions.filterByOrderId')}
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
        getRowId={(row) => row.id}
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
        title={t('systemAdmin.transactions.transactionDetails')}
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
        title={t('systemAdmin.transactions.createRefund')}
        onClose={() => setRefundOpen(false)}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={refundLoading}>
              {refundLoading ? t('common.creating') : t('systemAdmin.transactions.createRefund')}
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

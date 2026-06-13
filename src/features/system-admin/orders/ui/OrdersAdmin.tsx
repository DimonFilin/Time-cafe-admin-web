'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CafeListItem } from '@/entities/cafe/types/cafe';
import type { Order, OrderStatus } from '@/entities/order/types/order';
import { listCafes } from '@/features/system-admin/cafes/api/cafes';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { Modal } from '@/shared/ui/modal/Modal';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';
import { t } from '@/i18n';
import { getCafeOrder, listCafeOrders, updateOrderStatus } from '../api/orders';

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

const orderStatusLabelKey: Record<OrderStatus, string> = {
  PENDING: 'orderStatus.pending',
  CONFIRMED: 'orderStatus.confirmed',
  CANCELLED: 'orderStatus.cancelled',
  COMPLETED: 'orderStatus.completed',
};

export function OrdersAdmin() {
  const [cafes, setCafes] = useState<CafeListItem[]>([]);
  const [cafesLoading, setCafesLoading] = useState(false);
  const [cafesError, setCafesError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    cafeId: '',
    status: '' as '' | OrderStatus,
    from: '',
    to: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<Order | null>(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusOrderId, setStatusOrderId] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState<OrderStatus>('PENDING');
  const [statusReason, setStatusReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const refreshCafes = useCallback(async () => {
    setCafesLoading(true);
    setCafesError(null);
    try {
      const data = await listCafes({ page: 1, limit: 100, includeDeleted: false });
      setCafes(data.items);
    } catch (e) {
      setCafes([]);
      setCafesError(e instanceof Error ? e.message : String(e));
    } finally {
      setCafesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCafes();
  }, [refreshCafes]);

  useEffect(() => {
    if (cafes.length > 0 && !filters.cafeId) {
      setFilters((s) => ({ ...s, cafeId: cafes[0].id }));
    }
  }, [cafes, filters.cafeId]);

  const refresh = useCallback(async () => {
    if (!filters.cafeId.trim()) {
      setRows([]);
      setTotal(0);
      setHasFetched(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCafeOrders({
        cafeId: filters.cafeId.trim(),
        page,
        limit,
        status: filters.status || undefined,
        from: filters.from.trim() || undefined,
        to: filters.to.trim() || undefined,
      });
      setRows(data.items);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
      setHasFetched(true);
    } catch (e) {
      setRows([]);
      setTotal(0);
      setHasFetched(true);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [filters.cafeId, filters.from, filters.status, filters.to, limit, page]);

  useEffect(() => {
    if (filters.cafeId.trim()) {
      void refresh();
    }
  }, [filters.cafeId, page, limit, refresh]);

  const openDetails = useCallback(
    async (orderId: string) => {
      if (!filters.cafeId.trim()) return;
      setDetailsOpen(true);
      setDetailsLoading(true);
      setDetailsError(null);
      setDetails(null);
      try {
        const o = await getCafeOrder({ cafeId: filters.cafeId.trim(), id: orderId });
        setDetails(o);
      } catch (e) {
        setDetailsError(e instanceof Error ? e.message : String(e));
      } finally {
        setDetailsLoading(false);
      }
    },
    [filters.cafeId],
  );

  const openStatus = (o: Order) => {
    setStatusOrderId(o.id);
    setStatusValue(o.status);
    setStatusReason(o.cancellationReason ?? '');
    setStatusError(null);
    setStatusOpen(true);
  };

  const onSaveStatus = async () => {
    if (!statusOrderId) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      await updateOrderStatus({
        id: statusOrderId,
        status: statusValue,
        cancellationReason: statusValue === 'CANCELLED' ? statusReason : undefined,
      });
      setStatusOpen(false);
      await refresh();
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatusLoading(false);
    }
  };

  const columns: DataTableColumn<Order>[] = useMemo(
    () => [
      {
        key: 'id',
        header: t('common.id'),
        render: (o) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{o.id}</span>
        ),
      },
      {
        key: 'orderNumber',
        header: t('orders.orderNumber'),
        render: (o) => (
          <div>
            <div className="font-medium">{o.orderNumber}</div>
            <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
              <span className="font-mono">{o.id}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (o) => <span className="font-mono text-xs">{o.status}</span>,
      },
      {
        key: 'sum',
        header: t('orders.total'),
        render: (o) => (
          <span className="font-mono text-xs">
            <MoneyAmount value={o.totalAmount} iconClassName="h-[0.95em] w-[0.78em]" />
          </span>
        ),
      },
      {
        key: 'pm',
        header: t('orders.paymentMethod'),
        render: (o) => <span className="font-mono text-xs">{o.paymentMethod}</span>,
      },
      {
        key: 'dt',
        header: t('orders.deliveryType'),
        render: (o) => <span className="font-mono text-xs">{o.deliveryType}</span>,
      },
      {
        key: 'created',
        header: t('workers.created'),
        render: (o) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(o.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[220px] text-right',
        render: (o) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="px-3 py-2" onClick={() => openDetails(o.id)}>
              {t('common.view')}
            </Button>
            <Button variant="secondary" className="px-3 py-2" onClick={() => openStatus(o)}>
              {t('common.status')}
            </Button>
          </div>
        ),
      },
    ],
    [openDetails],
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            {t('systemAdmin.orders.title')}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.orders.subtitle')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={refreshCafes} disabled={cafesLoading}>
            {t('systemAdmin.orders.refreshCafes')}
          </Button>
          <Button
            variant="secondary"
            onClick={refresh}
            disabled={isLoading || !filters.cafeId.trim()}
          >
            {t('systemAdmin.orders.refreshOrders')}
          </Button>
        </div>
      </div>

      {cafesError && <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{cafesError}</Card>}
      {error && <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{error}</Card>}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.appointmentsManagement.cafe')} *
            </div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.cafeId}
              onChange={(e) => setFilters((s) => ({ ...s, cafeId: e.target.value }))}
            >
              <option value="">{t('systemAdmin.orders.selectCafe')}</option>
              {cafes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('common.status')}</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters((s) => ({ ...s, status: e.target.value as '' | OrderStatus }))
              }
            >
              <option value="">{t('common.all')}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {t(orderStatusLabelKey[s])}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.orders.from')}
            </div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.from}
              onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))}
              placeholder="YYYY-MM-DD"
            />
            <p className="text-[10px] text-[rgb(var(--tc-muted))]">
              Оставьте пустым, чтобы показать все даты
            </p>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('systemAdmin.orders.to')}</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.to}
              onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))}
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setPage(1);
              refresh();
            }}
            disabled={!filters.cafeId.trim()}
          >
            {t('systemAdmin.cafes.apply')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFilters({ cafeId: '', status: '', from: '', to: '' });
              setPage(1);
              setRows([]);
              setTotal(0);
              setHasFetched(false);
            }}
          >
            {t('systemAdmin.cafes.reset')}
          </Button>
        </div>
      </Card>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(o) => o.id}
        isLoading={isLoading}
        error={null}
        page={page}
        pageSize={limit}
        total={total}
        emptyMessage={
          !filters.cafeId.trim()
            ? t('systemAdmin.orders.selectCafe')
            : hasFetched
              ? 'Нет записей за выбранный период. Проверьте фильтры дат.'
              : undefined
        }
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={(s) => {
          setPage(1);
          setLimit(s);
        }}
      />

      <Modal
        open={detailsOpen}
        title={t('systemAdmin.orders.orderDetails')}
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
            <>
              <Card className="p-4">
                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">orderNumber:</span>{' '}
                    <span className="font-mono">{details.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">status:</span>{' '}
                    <span className="font-mono">{details.status}</span>
                  </div>
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">totalAmount:</span>{' '}
                    <span className="font-mono">
                      <MoneyAmount
                        value={details.totalAmount}
                        iconClassName="h-[0.95em] w-[0.78em]"
                      />
                    </span>
                  </div>
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">userId:</span>{' '}
                    <span className="font-mono">{details.userId}</span>
                  </div>
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">cafeId:</span>{' '}
                    <span className="font-mono">{details.cafeId}</span>
                  </div>
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">contactPhone:</span>{' '}
                    <span className="font-mono">{details.contactPhone}</span>
                  </div>
                  {details.notes && (
                    <div>
                      <span className="text-[rgb(var(--tc-muted))]">notes:</span> {details.notes}
                    </div>
                  )}
                  {details.cancellationReason && (
                    <div className="text-[rgb(var(--tc-danger))]">
                      cancellationReason: {details.cancellationReason}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-sm font-semibold">Items</div>
                <div className="mt-3 overflow-auto rounded-xl border border-[rgb(var(--tc-border))]">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] text-left">
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Qty</th>
                        <th className="px-4 py-3 font-semibold">Unit</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.items.map((it) => (
                        <tr
                          key={it.id}
                          className="border-b border-[rgb(var(--tc-border))] last:border-b-0"
                        >
                          <td className="px-4 py-3">{it.itemName}</td>
                          <td className="px-4 py-3 font-mono text-xs">{it.quantity}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <MoneyAmount
                              value={it.unitPrice}
                              iconClassName="h-[0.9em] w-[0.75em]"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <MoneyAmount
                              value={it.totalPrice}
                              iconClassName="h-[0.9em] w-[0.75em]"
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--tc-muted))]">
                            {it.notes ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <div className="text-sm text-[rgb(var(--tc-muted))]">Нет данных</div>
          )}
        </div>
      </Modal>

      <Modal
        open={statusOpen}
        title={t('systemAdmin.orders.updateStatus')}
        onClose={() => setStatusOpen(false)}
        size="lg"
      >
        <div className="grid gap-3">
          {statusError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{statusError}</Card>
          )}
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">{t('common.status')} *</div>
            <select
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value as OrderStatus)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {t(orderStatusLabelKey[s])}
                </option>
              ))}
            </select>
          </div>
          {statusValue === 'CANCELLED' && (
            <div className="grid gap-1">
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                {t('systemAdmin.orders.cancellationReason')} *
              </div>
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          )}
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setStatusOpen(false)}
              disabled={statusLoading}
            >
              Cancel
            </Button>
            <Button onClick={onSaveStatus} disabled={statusLoading}>
              {statusLoading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

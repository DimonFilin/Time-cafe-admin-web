'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Appointment, AppointmentStatus } from '@/entities/appointment/types/appointment';
import type { CafeListItem } from '@/entities/cafe/types/cafe';
import { listCafes } from '@/features/system-admin/cafes/api/cafes';
import { Button } from '@/shared/ui/button/Button';
import { Card } from '@/shared/ui/card/Card';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';
import { t } from '@/i18n';
import { confirmAppointment, getCafeAppointment, listCafeAppointments } from '../api/appointments';

const statuses: AppointmentStatus[] = ['pending', 'confirmed', 'cancelled', 'completed'];

export function AppointmentsAdmin() {
  const [cafes, setCafes] = useState<CafeListItem[]>([]);
  const [cafesLoading, setCafesLoading] = useState(false);
  const [cafesError, setCafesError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    cafeId: '',
    status: '' as '' | AppointmentStatus,
    from: '',
    to: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<Appointment | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const refresh = useCallback(async () => {
    if (!filters.cafeId.trim()) {
      setRows([]);
      setTotal(0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCafeAppointments({
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
    } catch (e) {
      setRows([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [filters.cafeId, filters.from, filters.status, filters.to, limit, page]);

  const openDetails = useCallback(
    async (appointmentId: string) => {
      if (!filters.cafeId.trim()) return;
      setDetailsOpen(true);
      setDetailsLoading(true);
      setDetailsError(null);
      setDetails(null);
      try {
        const a = await getCafeAppointment({ cafeId: filters.cafeId.trim(), appointmentId });
        setDetails(a);
      } catch (e) {
        setDetailsError(e instanceof Error ? e.message : String(e));
      } finally {
        setDetailsLoading(false);
      }
    },
    [filters.cafeId],
  );

  const openConfirm = (a: Appointment) => {
    setConfirmId(a.id);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!confirmId) return;
    setConfirmLoading(true);
    setError(null);
    try {
      await confirmAppointment({ appointmentId: confirmId });
      setConfirmOpen(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns: DataTableColumn<Appointment>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'ID',
        render: (a) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{a.id}</span>
        ),
      },
      {
        key: 'dt',
        header: t('systemAdmin.appointmentsManagement.dateTime'),
        render: (a) => (
          <div>
            <div className="font-medium">{new Date(a.dateTime).toLocaleString()}</div>
            <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.appointmentsManagement.duration')}:{' '}
              <span className="font-mono">{a.duration}</span>{' '}
              {t('systemAdmin.appointmentsManagement.min')}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (a) => <span className="font-mono text-xs">{a.status}</span>,
      },
      {
        key: 'user',
        header: t('systemAdmin.appointmentsManagement.userId'),
        render: (a) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{a.userId}</span>
        ),
      },
      {
        key: 'sum',
        header: t('orders.total'),
        render: (a) =>
          a.totalAmount != null && a.totalAmount !== '' ? (
            <span className="font-mono text-xs">
              <MoneyAmount value={a.totalAmount} iconClassName="h-[0.95em] w-[0.78em]" />
            </span>
          ) : (
            <span className="font-mono text-xs">-</span>
          ),
      },
      {
        key: 'pm',
        header: t('orders.paymentMethod'),
        render: (a) => <span className="font-mono text-xs">{a.paymentMethod ?? '-'}</span>,
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[260px] text-right',
        render: (a) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="px-3 py-2" onClick={() => openDetails(a.id)}>
              {t('common.view')}
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2"
              disabled={a.status !== 'pending'}
              title={
                a.status !== 'pending'
                  ? t('systemAdmin.appointmentsManagement.confirmAvailable')
                  : undefined
              }
              onClick={() => openConfirm(a)}
            >
              {t('appointments.confirm')}
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
            {t('systemAdmin.appointmentsManagement.title')}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            {t('systemAdmin.appointmentsManagement.subtitle')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={refreshCafes} disabled={cafesLoading}>
            {t('systemAdmin.appointmentsManagement.refreshCafes')}
          </Button>
          <Button
            variant="secondary"
            onClick={refresh}
            disabled={isLoading || !filters.cafeId.trim()}
          >
            {t('systemAdmin.appointmentsManagement.refreshAppointments')}
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
              <option value="">{t('systemAdmin.appointmentsManagement.selectCafe')}</option>
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
                setFilters((s) => ({ ...s, status: e.target.value as '' | AppointmentStatus }))
              }
            >
              <option value="">{t('common.all')}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.appointmentsManagement.fromIso')}
            </div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.from}
              onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))}
              placeholder={t('systemAdmin.appointmentsManagement.fromPlaceholder')}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.appointmentsManagement.toIso')}
            </div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.to}
              onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))}
              placeholder={t('systemAdmin.appointmentsManagement.toPlaceholder')}
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
            }}
          >
            {t('systemAdmin.cafes.reset')}
          </Button>
        </div>
      </Card>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(a) => a.id}
        isLoading={isLoading}
        error={null}
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={(s) => {
          setPage(1);
          setLimit(s);
        }}
      />

      <Modal
        open={detailsOpen}
        title={t('systemAdmin.appointmentsManagement.appointmentDetails')}
        onClose={() => setDetailsOpen(false)}
        size="2xl"
      >
        <div className="grid gap-3">
          {detailsError && (
            <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{detailsError}</Card>
          )}
          {detailsLoading ? (
            <div className="text-sm text-[rgb(var(--tc-muted))]">{t('common.loading')}</div>
          ) : details ? (
            <Card className="p-4">
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">id:</span>{' '}
                  <span className="font-mono">{details.id}</span>
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">{t('common.status')}:</span>{' '}
                  <span className="font-mono">{details.status}</span>
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.appointmentsManagement.dateTime')}:
                  </span>{' '}
                  <span className="font-mono">{details.dateTime}</span>
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.appointmentsManagement.duration')}:
                  </span>{' '}
                  <span className="font-mono">{details.duration}</span>{' '}
                  {t('systemAdmin.appointmentsManagement.min')}
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.appointmentsManagement.userId')}:
                  </span>{' '}
                  <span className="font-mono">{details.userId}</span>
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">
                    {t('systemAdmin.appointmentsManagement.cafeId')}:
                  </span>{' '}
                  <span className="font-mono">{details.cafeId}</span>
                </div>
                {details.qrCode && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">
                      {t('systemAdmin.appointmentsManagement.qrCode')}:
                    </span>{' '}
                    <span className="font-mono">{details.qrCode}</span>
                  </div>
                )}
                {details.totalAmount && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[rgb(var(--tc-muted))]">
                      {t('systemAdmin.appointmentsManagement.totalAmount')}:
                    </span>{' '}
                    <span className="font-mono">
                      <MoneyAmount
                        value={details.totalAmount}
                        iconClassName="h-[0.95em] w-[0.78em]"
                      />
                    </span>
                  </div>
                )}
                {details.paymentMethod && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">
                      {t('systemAdmin.appointmentsManagement.paymentMethod')}:
                    </span>{' '}
                    <span className="font-mono">{details.paymentMethod}</span>
                  </div>
                )}
                {details.orderId && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">
                      {t('systemAdmin.appointmentsManagement.orderId')}:
                    </span>{' '}
                    <span className="font-mono">{details.orderId}</span>
                  </div>
                )}
                {details.transactionId && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">
                      {t('systemAdmin.appointmentsManagement.transactionId')}:
                    </span>{' '}
                    <span className="font-mono">{details.transactionId}</span>
                  </div>
                )}
                {details.notes && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">
                      {t('systemAdmin.appointmentsManagement.notes')}:
                    </span>{' '}
                    {details.notes}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="text-sm text-[rgb(var(--tc-muted))]">
              {t('systemAdmin.orders.noData')}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title={t('systemAdmin.appointmentsManagement.confirmAppointment')}
        description={t('systemAdmin.appointmentsManagement.confirmDescription')}
        confirmText={t('appointments.confirm')}
        isLoading={confirmLoading}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
      />
    </div>
  );
}

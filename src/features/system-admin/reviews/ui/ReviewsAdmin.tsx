'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Review } from '@/entities/review/types/review';
import { Button } from '@/shared/ui/button/Button';
import { Card } from '@/shared/ui/card/Card';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import type { DataTableColumn } from '@/shared/ui/data-table/DataTable';
import { Modal } from '@/shared/ui/modal/Modal';
import { getReview, listReviews } from '../api/reviews';

export function ReviewsAdmin() {
  const [filters, setFilters] = useState({
    cafeId: '',
    minRating: '',
    verifiedOnly: false,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<Review | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const minRating = filters.minRating.trim() === '' ? undefined : Number(filters.minRating);
      const data = await listReviews({
        page,
        limit,
        cafeId: filters.cafeId.trim() || undefined,
        minRating: Number.isFinite(minRating) ? minRating : undefined,
        verifiedOnly: filters.verifiedOnly || undefined,
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
  }, [filters.cafeId, filters.minRating, filters.verifiedOnly, limit, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openDetails = useCallback(async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetails(null);
    try {
      const r = await getReview(id);
      setDetails(r);
    } catch (e) {
      setDetailsError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const columns: DataTableColumn<Review>[] = useMemo(
    () => [
      {
        key: 'rating',
        header: 'Rating',
        render: (r) => <span className="font-mono text-xs">{r.rating}</span>,
      },
      {
        key: 'verified',
        header: 'Verified',
        render: (r) => (
          <input
            type="checkbox"
            checked={r.isVerified}
            readOnly
            className="h-4 w-4 accent-[rgb(var(--tc-accent))]"
          />
        ),
      },
      {
        key: 'user',
        header: 'User',
        render: (r) => (
          <div>
            <div className="font-medium">{r.userName}</div>
            <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
              <span className="font-mono">{r.userId}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'cafe',
        header: 'CafeId',
        render: (r) => (
          <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">{r.cafeId}</span>
        ),
      },
      {
        key: 'comment',
        header: 'Comment',
        render: (r) => (
          <div className="max-w-[520px] whitespace-pre-wrap break-words text-sm text-[rgb(var(--tc-muted))]">
            {r.comment ?? '-'}
          </div>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (r) => (
          <span className="text-xs text-[rgb(var(--tc-muted))]">
            {new Date(r.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[140px] text-right',
        render: (r) => (
          <div className="flex justify-end">
            <Button variant="secondary" className="px-3 py-2" onClick={() => openDetails(r.id)}>
              View
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
          <div className="text-2xl font-semibold tracking-tight">Reviews (публичные)</div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Используем публичные эндпоинты `GET /reviews` и `GET /reviews/:id`.
            Редактирование/удаление — только автором.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Card className="p-3 text-sm text-[rgb(var(--tc-danger))]">{error}</Card>}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">CafeId</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.cafeId}
              onChange={(e) => setFilters((s) => ({ ...s, cafeId: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-[rgb(var(--tc-muted))]">Min rating (0..5)</div>
            <input
              className="w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm font-mono"
              value={filters.minRating}
              onChange={(e) => setFilters((s) => ({ ...s, minRating: e.target.value }))}
              placeholder="4"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-[rgb(var(--tc-muted))]">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters((s) => ({ ...s, verifiedOnly: e.target.checked }))}
              />
              verifiedOnly
            </label>
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPage(1);
                refresh();
              }}
            >
              Apply
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({ cafeId: '', minRating: '', verifiedOnly: false });
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
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
        title="Review details"
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
            <Card className="p-4">
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">id:</span>{' '}
                  <span className="font-mono">{details.id}</span>
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">rating:</span>{' '}
                  <span className="font-mono">{details.rating}</span>
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">isVerified:</span>{' '}
                  <span className="font-mono">{String(details.isVerified)}</span>
                </div>
                {details.verifiedAt && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">verifiedAt:</span>{' '}
                    <span className="font-mono">{details.verifiedAt}</span>
                  </div>
                )}
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">user:</span> {details.userName}{' '}
                  <span className="font-mono text-xs text-[rgb(var(--tc-muted))]">
                    ({details.userId})
                  </span>
                </div>
                <div>
                  <span className="text-[rgb(var(--tc-muted))]">cafeId:</span>{' '}
                  <span className="font-mono">{details.cafeId}</span>
                </div>
                {details.orderId && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">orderId:</span>{' '}
                    <span className="font-mono">{details.orderId}</span>
                  </div>
                )}
                {details.comment && (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">comment:</span>
                    <div className="mt-1 whitespace-pre-wrap break-words rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-3 text-sm">
                      {details.comment}
                    </div>
                  </div>
                )}
                {details.pros?.length ? (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">pros:</span>
                    <div className="mt-1 text-sm">{details.pros.join(', ')}</div>
                  </div>
                ) : null}
                {details.cons?.length ? (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">cons:</span>
                    <div className="mt-1 text-sm">{details.cons.join(', ')}</div>
                  </div>
                ) : null}
                {details.photos?.length ? (
                  <div>
                    <span className="text-[rgb(var(--tc-muted))]">photos:</span>
                    <div className="mt-1 text-sm font-mono break-all">
                      {details.photos.join('\n')}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : (
            <div className="text-sm text-[rgb(var(--tc-muted))]">Нет данных</div>
          )}
        </div>
      </Modal>
    </div>
  );
}

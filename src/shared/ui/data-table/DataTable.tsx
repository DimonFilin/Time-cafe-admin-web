'use client';

import { useMemo } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button/Button';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  isLoading,
  error,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  emptyMessage,
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  page: number; // 1-based
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  emptyMessage?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const summary = useMemo(() => {
    if (total === 0) return '0 записей';
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);
    return `${from}-${to} из ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="w-full">
      <div className="overflow-auto rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))]">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] text-left">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-4 py-3 font-semibold', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-[rgb(var(--tc-muted))]" colSpan={columns.length}>
                  Загрузка...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-6 text-[rgb(var(--tc-danger))]" colSpan={columns.length}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[rgb(var(--tc-muted))]" colSpan={columns.length}>
                  {emptyMessage ?? 'Нет данных'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-b border-[rgb(var(--tc-border))] last:border-b-0"
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3 align-top', c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[rgb(var(--tc-muted))]">{summary}</div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / стр.
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => onPageChange(1)} disabled={!canPrev}>
            {'<<'}
          </Button>
          <Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
            {'<'}
          </Button>
          <div className="px-2 text-sm text-[rgb(var(--tc-muted))]">
            {page} / {totalPages}
          </div>
          <Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
            {'>'}
          </Button>
          <Button variant="secondary" onClick={() => onPageChange(totalPages)} disabled={!canNext}>
            {'>>'}
          </Button>
        </div>
      </div>
    </div>
  );
}

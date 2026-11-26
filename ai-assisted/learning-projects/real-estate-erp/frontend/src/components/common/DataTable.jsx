import React from 'react';
import { Pagination } from '../ui/Pagination';
import { EmptyState, ErrorState, LoadingSkeleton } from './CommonStates';

export function DataTable({
  columns,
  rows,
  keyField = 'id',
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or create a new entry.',
  emptyAction = null,
  pagination = null,
  onRowClick = null,
}) {
  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr
                key={row[keyField] ?? idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors hover:bg-slate-50/80 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 text-slate-800 ${
                      col.align === 'right' ? 'text-right font-mono tabular-nums' : 'text-left'
                    } ${col.mono ? 'font-mono tabular-nums' : ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}

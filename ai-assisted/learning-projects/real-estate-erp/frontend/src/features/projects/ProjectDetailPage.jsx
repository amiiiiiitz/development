import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { inventoryService, projectsService } from '../../services/erpServices';
import { PageHeader, ErrorState, LoadingSkeleton } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { extractApiError, formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const projQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsService.get(id),
  });

  const invQuery = useQuery({
    queryKey: ['project-inventory', id],
    queryFn: () => inventoryService.list({ project_id: id, page_size: 100 }),
  });

  if (projQuery.isLoading) return <LoadingSkeleton rows={6} />;
  if (projQuery.error) {
    return <ErrorState message={extractApiError(projQuery.error)} onRetry={projQuery.refetch} />;
  }

  const p = projQuery.data;
  const stats = p.stats || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${p.project_code} · ${p.name}`}
        description={`${p.location} · ${p.project_type}`}
        actions={
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Status</p>
          <div className="mt-2">
            <StatusBadge status={p.status} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Inventory Breakdown</p>
          <p className="mt-1.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatNumber(stats.available_units)} avail / {formatNumber(stats.total_units)} total
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {stats.reserved_units} reserved · {stats.booked_units} booked · {stats.sold_units} sold
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Active Booking Value</p>
          <p className="mt-1.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(stats.total_booking_value)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{stats.total_bookings} active bookings</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Net Collected Revenue</p>
          <p className="mt-1.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(stats.total_collected)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block">Site Address</span>
          <span className="font-medium text-slate-900 mt-0.5 block">{p.address}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Timeline</span>
          <span className="font-mono text-slate-900 mt-0.5 block">
            {formatDate(p.start_date)} → {formatDate(p.expected_completion_date)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Land Area & Buildings</span>
          <span className="font-mono text-slate-900 mt-0.5 block">
            {p.total_land_area ? `${formatNumber(p.total_land_area)} sq ft` : '—'} ·{' '}
            {p.number_of_buildings ?? '—'} buildings
          </span>
        </div>
        {p.description && (
          <div className="md:col-span-3 border-t border-slate-100 pt-3">
            <span className="text-slate-500 block">Description</span>
            <p className="mt-1 text-slate-700 leading-relaxed">{p.description}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Associated Inventory Units</h2>
        <DataTable
          columns={[
            { key: 'unit_number', label: 'Unit No', mono: true },
            { key: 'building_name', label: 'Building / Block' },
            { key: 'unit_type', label: 'Type' },
            { key: 'size_sqft', label: 'Size (Sq Ft)', align: 'right', render: (r) => formatNumber(r.size_sqft) },
            { key: 'final_selling_price', label: 'Final Price', align: 'right', render: (r) => formatCurrency(r.final_selling_price) },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={invQuery.data?.items || []}
          isLoading={invQuery.isLoading}
          onRowClick={(u) => navigate(`/inventory/${u.id}`)}
          emptyTitle="No inventory units under this project"
          emptyDescription="Add units in the Inventory module and assign them to this project."
        />
      </div>
    </div>
  );
}

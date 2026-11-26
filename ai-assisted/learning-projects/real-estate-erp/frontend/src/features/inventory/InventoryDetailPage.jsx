import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { inventoryService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { INVENTORY_STATUSES } from '../../constants/erpOptions';
import { PageHeader, ErrorState, LoadingSkeleton } from '../../components/common/CommonStates';
import { Button } from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/FormFields';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters';

export function InventoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'inventory:write');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [nextStatus, setNextStatus] = useState('');
  const [reason, setReason] = useState('');

  const { data: unit, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory-unit', id],
    queryFn: () => inventoryService.get(id),
  });

  const statusMutation = useMutation({
    mutationFn: () => inventoryService.changeStatus(id, { status: nextStatus, reason }),
    onSuccess: () => {
      toast.success('Inventory status updated.');
      setReason('');
      setNextStatus('');
      queryClient.invalidateQueries({ queryKey: ['inventory-unit', id] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState message={extractApiError(error)} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Unit ${unit.unit_number} · ${unit.project_name || ''}`}
        description={`${unit.unit_type} · ${formatNumber(unit.size_sqft)} sq ft`}
        actions={
          <Button variant="secondary" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Unit Specifications & Pricing</h2>
            <StatusBadge status={unit.status} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Project Code</span>
              <span className="font-mono font-medium text-slate-900">{unit.project_code}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Building / Floor</span>
              <span className="font-medium text-slate-900">
                {unit.building_name || '—'} · Floor {unit.floor_number ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Bed / Bath</span>
              <span className="font-mono text-slate-900">
                {unit.bedrooms ?? '—'} BR / {unit.bathrooms ?? '—'} BA
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Base Price</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatCurrency(unit.base_price)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Additional Charges</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatCurrency(unit.additional_charges)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Discount</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatCurrency(unit.discount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Final Selling Price</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 text-sm">
                {formatCurrency(unit.final_selling_price)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Orientation</span>
              <span className="text-slate-900">{unit.facing || '—'}</span>
            </div>
          </div>
          {unit.description && (
            <div className="border-t border-slate-100 pt-3 text-xs text-slate-700">
              {unit.description}
            </div>
          )}
        </div>

        {canWrite && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Authorized Status Update</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Backend rules enforce booking integrity: Reserved/Booked/Available transitions tied to active bookings must go through Booking Management.
            </p>
            <Select
              label="Target Status"
              placeholder="Select status"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              options={INVENTORY_STATUSES.filter((s) => s !== unit.status)}
            />
            <Input
              label="Reason for Change"
              placeholder="e.g. Handover keys delivered"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!nextStatus || reason.trim().length < 3}
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            >
              Update Unit Status
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Status Audit History</h2>
        {unit.status_history?.length ? (
          <div className="divide-y divide-slate-100 text-xs">
            {unit.status_history.map((h) => (
              <div key={h.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {h.previous_status ? <StatusBadge status={h.previous_status} /> : <span className="text-slate-400">Created</span>}
                  <span className="text-slate-400">→</span>
                  <StatusBadge status={h.new_status} />
                  <span className="text-slate-700 ml-2">{h.reason || '—'}</span>
                </div>
                <div className="text-slate-500 font-mono">
                  {h.changed_by_name || 'System'} · {formatDateTime(h.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No status transitions recorded.</p>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Award, XCircle } from 'lucide-react';
import { bookingsService, collectionsService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { PageHeader, ErrorState, LoadingSkeleton } from '../../components/common/CommonStates';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/FormFields';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'bookings:write');
  const canCancel = hasPermission(user, 'bookings:cancel');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const bookingQuery = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsService.get(id),
  });

  const colQuery = useQuery({
    queryKey: ['booking-collections', id],
    queryFn: () => collectionsService.list({ booking_id: id, page_size: 50 }),
    enabled: hasPermission(user, 'collections:read'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => bookingsService.confirm(id),
    onSuccess: () => {
      toast.success('Booking confirmed.');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const completeSaleMutation = useMutation({
    mutationFn: () => bookingsService.completeSale(id),
    onSuccess: () => {
      toast.success('Unit marked as Sold.');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingsService.cancel(id, { reason: cancelReason }),
    onSuccess: () => {
      toast.success('Booking cancelled and unit restored to Available.');
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  if (bookingQuery.isLoading) return <LoadingSkeleton rows={6} />;
  if (bookingQuery.error) {
    return <ErrorState message={extractApiError(bookingQuery.error)} onRetry={bookingQuery.refetch} />;
  }

  const b = bookingQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${b.booking_reference} · ${b.customer_name}`}
        description={`${b.project_name} · Unit ${b.unit_number} (${b.unit_type})`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/bookings')}>
              <ArrowLeft className="h-4 w-4" />
              All Bookings
            </Button>
            {canWrite && b.status === 'Pending' && (
              <Button onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending}>
                <CheckCircle className="h-4 w-4" />
                Confirm Booking
              </Button>
            )}
            {canWrite && b.status === 'Confirmed' && (
              <Button
                variant="secondary"
                onClick={() => completeSaleMutation.mutate()}
                loading={completeSaleMutation.isPending}
              >
                <Award className="h-4 w-4" />
                Mark Unit Sold
              </Button>
            )}
            {canCancel && b.status !== 'Cancelled' && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4" />
                Cancel Booking
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Booking Status</p>
          <div className="mt-2">
            <StatusBadge status={b.status} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Final Agreed Price</p>
          <p className="mt-1.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(b.final_agreed_price)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Collected</p>
          <p className="mt-1.5 text-lg font-semibold font-mono tabular-nums text-emerald-700">
            {formatCurrency(b.total_collected)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Outstanding Balance</p>
          <p className="mt-1.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(b.outstanding_balance)}
          </p>
        </div>
      </div>

      {b.cancellation_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-900">
          <p className="font-semibold">Cancellation Reason</p>
          <p className="mt-1">{b.cancellation_reason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Booking Status History</h2>
          {b.status_history?.length ? (
            <div className="divide-y divide-slate-100 text-xs">
              {b.status_history.map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-slate-900">
                      {h.previous_status ? `${h.previous_status} → ${h.new_status}` : h.new_status}
                    </span>
                    <p className="text-slate-500 mt-0.5">{h.reason}</p>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0">
                    {h.changed_by_name} · {formatDateTime(h.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No status history entries.</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Recorded Collections</h2>
          {colQuery.data?.items?.length ? (
            <div className="divide-y divide-slate-100 text-xs">
              {colQuery.data.items.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono font-medium text-slate-900">{c.collection_reference}</p>
                    <p className="text-slate-500">
                      {c.payment_type} · {c.payment_method} · {formatDate(c.payment_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(c.payment_amount)}
                    </span>
                    {c.is_reversed && (
                      <div className="mt-1">
                        <StatusBadge status="Reversed" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No collections recorded for this booking.</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Booking"
        message="This will cancel the booking and restore the inventory unit to Available. Completed sales cannot be cancelled."
        confirmLabel="Confirm Cancellation"
        loading={cancelMutation.isPending}
      >
        <Textarea
          label="Cancellation Reason"
          required
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}

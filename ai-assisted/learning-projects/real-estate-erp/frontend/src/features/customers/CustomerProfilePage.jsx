import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { customersService } from '../../services/erpServices';
import { PageHeader, ErrorState, LoadingSkeleton } from '../../components/common/CommonStates';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { extractApiError, formatCurrency, formatDate } from '../../utils/formatters';

export function CustomerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-profile', id],
    queryFn: () => customersService.getProfile(id),
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState message={extractApiError(error)} onRetry={refetch} />;

  const { customer, bookings = [], collections = [], complaints = [] } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${customer.full_name} · ${customer.customer_code}`}
        description={`${customer.phone}${customer.email ? ` · ${customer.email}` : ''}`}
        actions={
          <Button variant="secondary" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Button>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block">Sales Executive</span>
          <span className="font-medium text-slate-900 mt-0.5 block">
            {customer.assigned_sales_executive_name || 'Unassigned'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Occupation / Nationality</span>
          <span className="font-medium text-slate-900 mt-0.5 block">
            {customer.occupation || '—'} · {customer.nationality || '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Reference</span>
          <span className="font-mono text-slate-900 mt-0.5 block">
            {customer.identification_reference || '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Address</span>
          <span className="text-slate-900 mt-0.5 block">{customer.address || '—'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Booking History</h2>
          {bookings.length ? (
            <div className="divide-y divide-slate-100 text-xs">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  className="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 px-1 rounded"
                >
                  <div>
                    <p className="font-mono font-medium text-slate-900">{b.booking_reference}</p>
                    <p className="text-slate-500">
                      {b.project_name} · Unit {b.unit_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(b.final_agreed_price)}
                    </p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No bookings found for this customer.</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Payment History</h2>
          {collections.length ? (
            <div className="divide-y divide-slate-100 text-xs">
              {collections.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono font-medium text-slate-900">
                      {c.collection_reference}
                    </p>
                    <p className="text-slate-500">
                      {c.payment_type} · {formatDate(c.payment_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(c.payment_amount)}
                    </p>
                    {c.is_reversed && <StatusBadge status="Reversed" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No payments recorded for this customer.</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Support Complaints</h2>
          {complaints.length ? (
            <div className="divide-y divide-slate-100 text-xs">
              {complaints.map((cm) => (
                <div key={cm.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{cm.subject}</p>
                    <p className="text-slate-500 font-mono">{cm.complaint_reference}</p>
                  </div>
                  <StatusBadge status={cm.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No complaints logged.</p>
          )}
        </div>
      </div>
    </div>
  );
}

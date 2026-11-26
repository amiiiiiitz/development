import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, RotateCcw } from 'lucide-react';
import { bookingsService, collectionsService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatCurrency, formatDate } from '../../utils/formatters';

const collectionSchema = z.object({
  booking_id: z.string().min(1, 'Select a booking.'),
  payment_amount: z.coerce.number().positive('Amount must be positive.'),
  payment_date: z.string().optional(),
  payment_method: z.string().min(1),
  payment_type: z.string().min(1),
  transaction_reference: z.string().optional(),
  notes: z.string().optional(),
});

export function CollectionsPage() {
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'collections:write');
  const canReverse = hasPermission(user, 'collections:reverse');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reverseReason, setReverseReason] = useState('');

  const summaryQuery = useQuery({
    queryKey: ['collections-summary', startDate, endDate],
    queryFn: () =>
      collectionsService.getSummary({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  const listQuery = useQuery({
    queryKey: ['collections', search, paymentMethod, startDate, endDate, page],
    queryFn: () =>
      collectionsService.list({
        search: search || undefined,
        payment_method: paymentMethod || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        page_size: 15,
      }),
  });

  const bookingsQuery = useQuery({
    queryKey: ['bookings-for-collection'],
    queryFn: () => bookingsService.list({ page_size: 100 }),
    enabled: modalOpen,
  });

  const form = useForm({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      booking_id: '',
      payment_amount: '',
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'Bank Transfer',
      payment_type: 'Partial Payment',
      transaction_reference: '',
      notes: '',
    },
  });

  const selectedBookingId = form.watch('booking_id');
  const selectedBooking = (bookingsQuery.data?.items || []).find((b) => b.id === selectedBookingId);

  const createMutation = useMutation({
    mutationFn: (values) =>
      collectionsService.create({
        ...values,
        payment_date: values.payment_date || undefined,
      }),
    onSuccess: (col) => {
      toast.success(`Collection ${col.collection_reference} recorded.`);
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const reverseMutation = useMutation({
    mutationFn: () =>
      collectionsService.reverse(reverseTarget.id, { reason: reverseReason }),
    onSuccess: (rev) => {
      toast.success(`Reversal ${rev.collection_reference} recorded.`);
      setReverseTarget(null);
      setReverseReason('');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const summary = summaryQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collection Management"
        description="Immutable customer payment ledger, outstanding balance validation, and controlled reversals."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                form.reset({
                  booking_id: '',
                  payment_amount: '',
                  payment_date: new Date().toISOString().slice(0, 10),
                  payment_method: 'Bank Transfer',
                  payment_type: 'Partial Payment',
                  transaction_reference: '',
                  notes: '',
                });
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Record Collection
            </Button>
          )
        }
      />

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total Collected</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatCurrency(summary.total_collected)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total Refunded</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-red-700">
              {formatCurrency(summary.total_refunded)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Net Collected</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-emerald-700">
              {formatCurrency(summary.net_collected)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total Outstanding Balance</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatCurrency(summary.total_outstanding_balance)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search receipt ref, booking, or customer..."
          className="w-full sm:w-72"
        />
        <select
          aria-label="Filter by payment method"
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All Payment Methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Start date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        />
        <input
          type="date"
          aria-label="End date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        />
      </div>

      <DataTable
        columns={[
          { key: 'collection_reference', label: 'Receipt Ref', mono: true },
          { key: 'payment_date', label: 'Date', mono: true, render: (r) => formatDate(r.payment_date) },
          { key: 'booking_reference', label: 'Booking', mono: true },
          { key: 'customer_name', label: 'Customer' },
          { key: 'payment_method', label: 'Method' },
          { key: 'payment_type', label: 'Type' },
          {
            key: 'payment_amount',
            label: 'Amount',
            align: 'right',
            render: (r) => formatCurrency(r.payment_amount),
          },
          {
            key: 'state',
            label: 'Ledger State',
            render: (r) =>
              r.is_reversed ? (
                <StatusBadge status="Reversed" />
              ) : r.payment_type === 'Reversal' ? (
                <StatusBadge status="Cancelled" />
              ) : (
                <StatusBadge status="Confirmed" />
              ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) =>
              canReverse && !r.is_reversed && r.payment_type !== 'Reversal' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReverseTarget(r);
                    setReverseReason('');
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 text-red-700" />
                  Reverse
                </Button>
              ) : null,
          },
        ]}
        rows={listQuery.data?.items || []}
        isLoading={listQuery.isLoading}
        error={listQuery.error ? extractApiError(listQuery.error) : null}
        onRetry={listQuery.refetch}
        emptyTitle="No collection records found"
        emptyDescription="Record a payment against an active booking to start tracking collections."
        pagination={
          listQuery.data
            ? {
                page: listQuery.data.page,
                totalPages: listQuery.data.total_pages,
                total: listQuery.data.total,
                pageSize: listQuery.data.page_size,
                onPageChange: setPage,
              }
            : null
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Payment Collection"
        size="md"
      >
        <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <Select
            label="Booking"
            required
            placeholder="Select booking"
            options={(bookingsQuery.data?.items || []).map((b) => ({
              value: b.id,
              label: `${b.booking_reference} · ${b.customer_name} (${b.status})`,
            }))}
            error={form.formState.errors.booking_id?.message}
            {...form.register('booking_id')}
          />

          {selectedBooking && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Agreed Price</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(selectedBooking.final_agreed_price)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Collected</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {formatCurrency(selectedBooking.total_collected)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Outstanding</span>
                <span className="font-mono font-semibold text-blue-800">
                  {formatCurrency(selectedBooking.outstanding_balance)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              required
              error={form.formState.errors.payment_amount?.message}
              {...form.register('payment_amount')}
            />
            <Input label="Payment Date" type="date" {...form.register('payment_date')} />
            <Select
              label="Payment Method"
              options={PAYMENT_METHODS}
              {...form.register('payment_method')}
            />
            <Select
              label="Payment Type"
              options={PAYMENT_TYPES}
              {...form.register('payment_type')}
            />
          </div>

          <Input
            label="Transaction / Cheque Reference"
            placeholder="Optional bank reference number"
            {...form.register('transaction_reference')}
          />
          <Textarea label="Notes" {...form.register('notes')} />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Record Entry
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(reverseTarget)}
        onClose={() => setReverseTarget(null)}
        onConfirm={() => reverseMutation.mutate()}
        title={`Reverse Receipt ${reverseTarget?.collection_reference || ''}`}
        message="Financial history is immutable. Reversing creates a compensating negative reversal entry and restores the booking's outstanding balance."
        confirmLabel="Confirm Reversal"
        loading={reverseMutation.isPending}
      >
        <Textarea
          label="Reversal Reason (Required)"
          required
          placeholder="e.g. Cheque bounced / duplicate entry"
          value={reverseReason}
          onChange={(e) => setReverseReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
